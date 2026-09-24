import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import EquipementModal from "./EquipementModal";
import FicheTechniqueModal from "./FicheTechniqueModal";
import NouveauTypeModal from "./NouveauTypeModal";
import NouveauGroupeModal from "./NouveauGroupeModal";
import { useEquipements } from "../../context/EquipementsContext";
import { useControles } from "../../context/ControlesContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  telechargerCanevasXlsx,
  lireXlsxEquipements,
} from "./utils/excelEquipements";

// Colonnes du fichier Excel d'import des équipements, dans cet ordre.
const COLONNES_CSV = [
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

// Même correspondance que dans EquipementForm.jsx : un dernier contrôle
// n'est créé automatiquement que pour ces deux statuts.
const RESULTAT_PAR_STATUT = {
  Conforme: "Favorable",
  "Non conforme": "Défavorable",
};

const STATUT_TONE = {
  Conforme: "success",
  "Conforme avec réserve": "warning",
  "Non conforme": "danger",
};

const TITRES = { Fixe: "Équipements fixes", Mobile: "Engins mobiles" };

// Icône "étiquette QR" — renvoie vers la fiche équipement, où l'étiquette est affichée.
function IconQr() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

// Le contrôle le plus récent d'un équipement (pour les colonnes "Dernier Ctr." / "Prochain").
function dernierControle(eq) {
  if (!eq.controles?.length) return null;
  return [...eq.controles].sort(
    (a, b) => new Date(b.date_controle) - new Date(a.date_controle),
  )[0];
}

// Nombre de réserves encore ouvertes (statut différent de "Levée").
function reservesOuvertes(eq) {
  return (eq.controles ?? []).reduce(
    (total, c) =>
      total + (c.reserves ?? []).filter((r) => r.statut !== "Levée").length,
    0,
  );
}

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

// categorie : valeur initiale du filtre Fixe/Mobile ("Fixe" pour le lien "Équipements
// fixes" du menu). L'utilisateur peut ensuite changer ce filtre depuis la page.
export default function EquipementsListe({ categorie }) {
  const {
    equipements,
    typesEquipement,
    chargement,
    erreur,
    filiales: filialesToutes,
    sites: sitesTous,
    sitesDeFiliale,
    creerEquipement,
    rafraichirEquipements,
    supprimerEquipement,
    groupesEquipement,
  } = useEquipements();
  const { ajouterControle } = useControles();
  const { filiales, onglets, filialeActive } = useFilialeTheme();
  const { user } = useAuth();
  const estSuperAdmin = user?.role === "Super Admin";
  const [recherche, setRecherche] = useState("");
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState(categorie ?? "");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [fichierOuvert, setFichierOuvert] = useState(null);
  const [ficheOuverte, setFicheOuverte] = useState(null);
  const [nouveauTypeOuvert, setNouveauTypeOuvert] = useState(false);
  const [nouveauGroupeOuvert, setNouveauGroupeOuvert] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState(null);
  const inputImportRef = useRef(null);
  const navigate = useNavigate();

  // Boutons "Modifier"/"Supprimer" réservés au super admin, à côté de
  // "Ouvrir" dans la liste.
  async function supprimer(eq) {
    if (
      !window.confirm(
        `Supprimer l'équipement "${eq.id_equipement}" (${eq.designation ?? "sans désignation"}) ? Cette action est irréversible.`,
      )
    )
      return;
    try {
      await supprimerEquipement(eq.id_equipement);
    } catch (e) {
      alert(e.message);
    }
  }

  // --- Canevas : classeur .xlsx vierge (juste les libellés de colonnes,
  // aucune donnée) avec de vraies listes déroulantes Excel pour Filiale/
  // Site/Type/Statut, à remplir puis réimporter avec "Importer". ---
  function telechargerCanevas() {
    telechargerCanevasXlsx({
      colonnes: COLONNES_CSV,
      listes: {
        Filiale: filialesToutes.map((f) => f.code),
        Site: [...new Set(sitesTous.map((s) => s.libelle))],
        Type: typesEquipement.map((t) => t.libelle),
        Statut: Object.keys(STATUT_TONE),
      },
      // Vraies dates Excel (calendrier + refus de saisie invalide) plutôt
      // que du texte libre, pour ne jamais avoir de format incohérent à
      // l'import (voir excelEquipements.js).
      colonnesDate: ["Date_Mise_En_Service", "Date_Dernier_Controle"],
    });
  }

  // --- Import : crée un équipement par ligne du fichier .xlsx (via l'API
  // existante, mêmes règles que le formulaire de création). ---
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
        ? sitesDeFiliale(codeFiliale).find(
            (s) => s.libelle?.toLowerCase() === siteLibelle.toLowerCase(),
          )
        : null;

      const statutFinal = statut || "Conforme";
      try {
        const cree = await creerEquipement({
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
            await ajouterControle({
              equipementRef: cree.id_equipement,
              dateControle: dateDernierControle,
              organisme: organismeControle,
              resultat: RESULTAT_PAR_STATUT[statutFinal],
            });
          } catch (e) {
            erreurs.push(
              `Ligne ${numeroLigne} : équipement créé, mais le dernier contrôle n'a pas pu être enregistré (${e.message}).`,
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
    // rafraîchie manuellement (eq.controles est une relation à part).
    await rafraichirEquipements();
    setImportEnCours(false);
    setResultatImport({ succes, total: lignes.length, erreurs });
  }

  const titre = TITRES[categorieFiltre] ?? "Équipements";

  // Le menu "Type" affiche toujours TOUS les types (indépendant du filtre
  // "Groupe" choisi) : les 3 types de base + tous ceux ajoutés depuis les popups "+".
  const typesDisponibles = typesEquipement;

  // Liste des groupes proposés : Fixe/Mobile, plus ceux réellement utilisés par
  // les types existants, plus tous ceux de la table groupe_equipement (page
  // "Données de base > Groupes" et popup "+ nouveau groupe" — les deux
  // passent maintenant par la même table, plus de doublon en localStorage).
  const groupesDisponibles = useMemo(() => {
    const set = new Set(["Fixe", "Mobile"]);
    typesEquipement.forEach((t) => t.categorie && set.add(t.categorie));
    groupesEquipement.forEach((g) => set.add(g.libelle));
    return Array.from(set);
  }, [typesEquipement, groupesEquipement]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return equipements.filter((e) => {
      if (categorieFiltre && e.type_equipement?.categorie !== categorieFiltre)
        return false;
      if (
        filialeActive &&
        filialeActive !== "GROUPE" &&
        e.filiale?.code !== filialeActive
      )
        return false;
      if (filialeFiltre && e.filiale?.code !== filialeFiltre) return false;
      if (typeFiltre && String(e.id_type_equipement) !== String(typeFiltre))
        return false;
      if (statutFiltre && e.statut !== statutFiltre) return false;
      if (
        q &&
        !(
          e.id_equipement?.toLowerCase().includes(q) ||
          e.designation?.toLowerCase().includes(q) ||
          e.numero_serie?.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [
    equipements,
    recherche,
    categorieFiltre,
    filialeActive,
    filialeFiltre,
    typeFiltre,
    statutFiltre,
  ]);

  // Compteurs du sous-titre : sur l'ensemble filtré par filiale/recherche/type/statut,
  // sans tenir compte du filtre Fixe/Mobile lui-même (pour afficher tous les totaux).
  // Un par groupe RÉELLEMENT présent dans les équipements (pas seulement
  // Fixe/Mobile en dur) : un équipement d'un groupe personnalisé (ex.
  // "Mixte", créé depuis Données de base > Groupes) apparaît maintenant
  // aussi dans ce résumé au lieu de disparaître dans le total sans détail.
  const compteurs = useMemo(() => {
    const base = equipements.filter((e) => {
      if (
        filialeActive &&
        filialeActive !== "GROUPE" &&
        e.filiale?.code !== filialeActive
      )
        return false;
      if (filialeFiltre && e.filiale?.code !== filialeFiltre) return false;
      return true;
    });
    const parGroupe = {};
    base.forEach((e) => {
      const g = e.type_equipement?.categorie ?? "Non classé";
      parGroupe[g] = (parGroupe[g] ?? 0) + 1;
    });
    // Ordre : les groupes connus (Fixe, Mobile, Mixte...) dans l'ordre de la
    // liste Données de base, puis tout groupe non listé là (ex. équipement
    // sans type), pour ne jamais faire disparaître un compte.
    const ordre = [
      ...groupesEquipement.map((g) => g.libelle),
      ...Object.keys(parGroupe).filter(
        (g) => !groupesEquipement.some((ge) => ge.libelle === g),
      ),
    ];
    return {
      total: base.length,
      parGroupe,
      ordre: ordre.filter((g) => parGroupe[g]),
    };
  }, [equipements, filialeActive, filialeFiltre, groupesEquipement]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            {filialeActive === "GROUPE" || !filialeActive
              ? "Toutes les filiales"
              : (filiales.find((f) => f.code === filialeActive)?.libelle ??
                `Filiale ${filialeActive}`)}
          </div>
          <h1 style={{ fontSize: "22px" }}>{titre}</h1>
          <div
            style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}
          >
            {compteurs.total} équipement(s)
            {compteurs.ordre.length > 0 && " — "}
            {compteurs.ordre
              .map((g) => `${compteurs.parGroupe[g]} ${g.toLowerCase()}(s)`)
              .join(" / ")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={telechargerCanevas}
          >
            Canevas
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={importEnCours}
            onClick={() => inputImportRef.current?.click()}
          >
            {importEnCours ? "Import en cours…" : "Importer"}
          </button>
          <input
            ref={inputImportRef}
            type="file"
            accept=".xlsx"
            style={{ display: "none" }}
            onChange={gererImportFichier}
          />
          <button
            className="btn btn-primary"
            onClick={() => navigate("/equipements/nouveau")}
          >
            + Nouvel équipement
          </button>
        </div>
      </div>

      <div className="content">
        {resultatImport && (
          <Plate
            style={{
              padding: 14,
              marginBottom: 16,
              borderColor:
                resultatImport.erreurs.length > 0
                  ? "var(--danger)"
                  : "var(--success)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Import terminé : {resultatImport.succes} /{" "}
                {resultatImport.total} équipement(s) créé(s).
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "2px 8px", fontSize: 11.5 }}
                onClick={() => setResultatImport(null)}
              >
                Fermer
              </button>
            </div>
            {resultatImport.erreurs.length > 0 && (
              <ul
                style={{
                  marginTop: 8,
                  paddingLeft: 18,
                  fontSize: 12.5,
                  color: "var(--danger)",
                }}
              >
                {resultatImport.erreurs.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </Plate>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div className="field" style={{ maxWidth: 280, marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Rechercher (référence, désignation, n° série)…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="field" style={{ maxWidth: 200, marginBottom: 0 }}>
            <select
              value={filialeFiltre}
              onChange={(e) => setFilialeFiltre(e.target.value)}
            >
              <option value="">Toutes les filiales</option>
              {(onglets?.length
                ? onglets.filter((c) => c !== "GROUPE")
                : filiales.map((f) => f.code)
              ).map((code) => (
                <option key={code} value={code}>
                  {filiales.find((f) => f.code === code)?.libelle ?? code}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
            <div className="field" style={{ maxWidth: 180, marginBottom: 0 }}>
              <select
                value={categorieFiltre}
                onChange={(e) => setCategorieFiltre(e.target.value)}
              >
                <option value="">Tous les groupes</option>
                {groupesDisponibles.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              title="Créer un nouveau groupe"
              onClick={() => setNouveauGroupeOuvert(true)}
            >
              +
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
            <div className="field" style={{ maxWidth: 220, marginBottom: 0 }}>
              <select
                value={typeFiltre}
                onChange={(e) => setTypeFiltre(e.target.value)}
              >
                <option value="">Tous les types</option>
                {typesDisponibles.map((t) => (
                  <option
                    key={t.id_type_equipement}
                    value={t.id_type_equipement}
                  >
                    {t.libelle}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              title="Créer un nouveau type d'équipement"
              onClick={() => setNouveauTypeOuvert(true)}
            >
              +
            </button>
          </div>

          <div className="field" style={{ maxWidth: 200, marginBottom: 0 }}>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
            >
              <option value="">Tous statuts</option>
              {Object.keys(STATUT_TONE).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}
          >
            {erreur}
          </Plate>
        )}

        {chargement ? (
          <Plate style={{ padding: 16 }}>Chargement...</Plate>
        ) : (
          <>
            <Plate>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Filiale</th>
                      <th>Groupe</th>
                      <th>Type</th>
                      <th>Site</th>
                      <th>Dernier Ctr.</th>
                      <th>Prochain</th>
                      <th>Réserves</th>
                      <th>Statut</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtres.map((eq) => {
                      const dernier = dernierControle(eq);
                      const nbReserves = reservesOuvertes(eq);
                      return (
                        <tr
                          key={eq.id_equipement}
                          className="rowlink"
                          style={{ cursor: "pointer" }}
                          onClick={() => setFichierOuvert(eq.id_equipement)}
                        >
                          <td className="ref">{eq.id_equipement}</td>
                          <td style={{ fontWeight: 600 }}>
                            {eq.filiale?.libelle ?? "—"}
                          </td>
                          <td>
                            <Badge
                              tone={
                                eq.type_equipement?.categorie === "Mobile"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {eq.type_equipement?.categorie ??
                                eq.filiale?.code ??
                                "—"}
                            </Badge>
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {eq.type_equipement?.libelle ?? "—"}
                          </td>
                          <td>{eq.site?.libelle ?? "—"}</td>
                          <td>{formaterDate(dernier?.date_controle)}</td>
                          <td>{formaterDate(dernier?.prochaine_echeance)}</td>
                          <td>
                            {nbReserves > 0 ? (
                              <Badge tone="warning">{nbReserves}</Badge>
                            ) : (
                              <Badge tone="success">0</Badge>
                            )}
                          </td>
                          <td>
                            <Badge tone={STATUT_TONE[eq.statut] ?? "success"}>
                              {eq.statut}
                            </Badge>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: "4px 10px", fontSize: 12.5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFichierOuvert(eq.id_equipement);
                                }}
                              >
                                Ouvrir
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                title="Étiquette QR"
                                style={{ padding: "4px 8px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFicheOuverte(eq.id_equipement);
                                }}
                              >
                                <IconQr />
                              </button>
                              {estSuperAdmin && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    title="Modifier"
                                    style={{ padding: "4px 8px" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/equipements/${eq.id_equipement}/modifier`,
                                      );
                                    }}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    title="Supprimer"
                                    style={{
                                      padding: "4px 8px",
                                      color: "var(--danger)",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      supprimer(eq);
                                    }}
                                  >
                                    🗑
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Plate>

            {filtres.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  marginTop: 24,
                }}
              >
                Aucun équipement ne correspond à ces critères.
              </p>
            )}
          </>
        )}
      </div>

      {fichierOuvert && (
        <EquipementModal
          id={fichierOuvert}
          onClose={() => setFichierOuvert(null)}
        />
      )}

      {nouveauTypeOuvert && (
        <NouveauTypeModal
          onClose={() => setNouveauTypeOuvert(false)}
          onCree={(type) => setTypeFiltre(String(type.id_type_equipement))}
        />
      )}

      {ficheOuverte && (
        <FicheTechniqueModal
          id={ficheOuverte}
          onClose={() => setFicheOuverte(null)}
        />
      )}

      {nouveauGroupeOuvert && (
        <NouveauGroupeModal
          onClose={() => setNouveauGroupeOuvert(false)}
          onCree={(groupe) => {
            setCategorieFiltre(groupe.libelle);
            setTypeFiltre("");
          }}
        />
      )}
    </>
  );
}
