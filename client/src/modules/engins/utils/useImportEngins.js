import { useRef, useState } from "react";
import { useEquipements } from "../../../context/EquipementsContext";
import { useEngins } from "../../../context/EnginsContext";
import { useControlesEngin } from "../../../context/ControlesEnginContext";
import {
  telechargerCanevasXlsx,
  lireXlsxEquipements,
} from "../../equipements/utils/excelEquipements";

// Colonnes du fichier Excel d'import des ENGINS, dans cet ordre (les mêmes que
// pour les équipements).
const COLONNES = [
  "Filiale",
  "Site",
  "Type",
  "Designation",
  "Marque_Modele",
  "Numero_Serie",
  "Date_Mise_En_Service",
  "Periodicite_Mois",
  "Statut",
  "Fabricant",
  "Modele",
  "Annee_Fabrication",
  "Organisme_Controle",
  "Date_Dernier_Controle",
];

const STATUTS = ["Conforme", "Conforme avec réserve", "Non conforme"];

// Un dernier contrôle n'est créé automatiquement que pour ces deux statuts.
const RESULTAT_PAR_STATUT = {
  Conforme: "Favorable",
  "Non conforme": "Défavorable",
};

// Canevas Excel + import Excel des engins : crée un engin par ligne du fichier
// (via l'API des engins, mêmes règles que le formulaire de création).
// Utilisé par la liste des engins (boutons "Canevas" et "Importer").
export function useImportEngins() {
  const {
    filiales: filialesToutes,
    sites: sitesTous,
    sitesDeFiliale,
    typesEquipement,
  } = useEquipements();
  const { creerEngin, rafraichirEngins } = useEngins();
  const { ajouterControleEngin } = useControlesEngin();

  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState(null);
  const inputImportRef = useRef(null);

  // Classeur .xlsx vierge, avec de vraies listes déroulantes Excel pour
  // Filiale / Site / Type / Statut et de vraies dates pour les colonnes date.
  function telechargerCanevas() {
    telechargerCanevasXlsx({
      colonnes: COLONNES,
      listes: {
        Filiale: filialesToutes.map((f) => f.code),
        Site: [...new Set(sitesTous.map((s) => s.libelle))],
        Type: typesEquipement.map((t) => t.libelle),
        Statut: STATUTS,
      },
      colonnesDate: ["Date_Mise_En_Service", "Date_Dernier_Controle"],
      nomFichier: "canevas-engins.xlsx",
    });
  }

  async function gererImportFichier(event) {
    const fichier = event.target.files?.[0];
    event.target.value = ""; // permet de réimporter le même fichier ensuite
    if (!fichier) return;

    setImportEnCours(true);
    setResultatImport(null);
    const lignes = await lireXlsxEquipements(fichier);

    let succes = 0;
    const erreurs = [];

    for (let i = 0; i < lignes.length; i++) {
      const { numeroLigne, valeurs } = lignes[i];
      const [
        codeFiliale,
        siteLibelle,
        typeLibelle,
        designation,
        marqueModele,
        numeroSerie,
        dateMiseEnService,
        periodiciteMois,
        statut,
        fabricant,
        modele,
        anneeFabrication,
        organismeControle,
        dateDernierControle,
      ] = valeurs.map((v) => v?.trim() ?? "");

      const filiale = filialesToutes.find(
        (f) => f.code?.toLowerCase() === codeFiliale.toLowerCase(),
      );
      if (!filiale) {
        erreurs.push(
          `Ligne ${numeroLigne} : filiale "${codeFiliale}" inconnue.`,
        );
        continue;
      }
      const type = typesEquipement.find(
        (t) => t.libelle?.toLowerCase() === typeLibelle.toLowerCase(),
      );
      if (!type) {
        erreurs.push(`Ligne ${numeroLigne} : type "${typeLibelle}" inconnu.`);
        continue;
      }
      if (!designation || !numeroSerie || !dateMiseEnService) {
        erreurs.push(
          `Ligne ${numeroLigne} : désignation, n° de série et date de mise en service sont obligatoires.`,
        );
        continue;
      }
      if (!periodiciteMois || Number(periodiciteMois) < 1) {
        erreurs.push(`Ligne ${numeroLigne} : périodicité (mois) obligatoire.`);
        continue;
      }
      const site = siteLibelle
        ? sitesDeFiliale(filiale.code).find(
            (s) => s.libelle?.toLowerCase() === siteLibelle.toLowerCase(),
          )
        : null;
      // Le site choisi dans le fichier doit appartenir à la filiale de la
      // même ligne.
      if (siteLibelle && !site) {
        erreurs.push(
          `Ligne ${numeroLigne} : le site "${siteLibelle}" n'appartient pas à la filiale "${filiale.code}" (vérifie que tu as choisi le bon site pour cette filiale).`,
        );
        continue;
      }

      const statutFinal = statut || "Conforme";
      try {
        const cree = await creerEngin({
          codeFiliale,
          id_site: site?.id_site ?? "",
          id_type_equipement: type.id_type_equipement,
          designation,
          marque_modele: marqueModele,
          numero_serie: numeroSerie,
          date_mise_en_service: dateMiseEnService,
          periodicite_mois: Number(periodiciteMois),
          statut: statutFinal,
          fabricant,
          modele,
          annee_fabrication: anneeFabrication ? Number(anneeFabrication) : null,
          organisme_controle: organismeControle,
        });

        if (
          dateDernierControle &&
          organismeControle &&
          RESULTAT_PAR_STATUT[statutFinal]
        ) {
          try {
            await ajouterControleEngin({
              enginRef: cree.id_engin,
              dateControle: dateDernierControle,
              organisme: organismeControle,
              resultat: RESULTAT_PAR_STATUT[statutFinal],
            });
          } catch (e) {
            erreurs.push(
              `Ligne ${numeroLigne} : engin créé, mais le dernier contrôle n'a pas pu être enregistré (${e.message}).`,
            );
          }
        }
        succes++;
      } catch (e) {
        erreurs.push(`Ligne ${numeroLigne} : ${e.message}`);
      }
    }

    // Recharge la liste (avec les contrôles) une seule fois à la fin, sinon
    // "Dernier Ctr./Prochain" restent vides tant que la page n'est pas
    // rafraîchie (engin.controles est une relation à part).
    await rafraichirEngins();
    setImportEnCours(false);
    setResultatImport({ succes, total: lignes.length, erreurs });
  }

  return {
    telechargerCanevas,
    gererImportFichier,
    importEnCours,
    resultatImport,
    setResultatImport,
    inputImportRef,
  };
}
