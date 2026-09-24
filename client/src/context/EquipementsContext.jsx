import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../utils/api";

export const STATUTS_EQUIPEMENT = [
  "Conforme",
  "Conforme avec réserve",
  "Non conforme",
];
const EquipementsContext = createContext(null);

export function EquipementsProvider({ children }) {
  const [equipements, setEquipements] = useState([]);
  const [filiales, setFiliales] = useState([]);
  const [sites, setSites] = useState([]);
  const [typesEquipement, setTypesEquipement] = useState([]);
  const [groupesEquipement, setGroupesEquipement] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const rafraichirEquipements = useCallback(() => {
    setChargement(true);
    return apiFetch("/equipements")
      .then(setEquipements)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  const rafraichirTypes = useCallback(() => {
    return apiFetch("/type-equipements")
      .then(setTypesEquipement)
      .catch((e) => setErreur(e.message));
  }, []);

  const rafraichirGroupes = useCallback(() => {
    return apiFetch("/groupes-equipement")
      .then(setGroupesEquipement)
      .catch((e) => setErreur(e.message));
  }, []);

  // Au premier chargement (ou F5), on récupère tout en un seul aller-retour
  // (/donnees-initiales) au lieu de 4 requêtes séparées (équipements,
  // filiales, sites, types) : lancées "en parallèle" depuis le navigateur,
  // elles s'empilaient quand même sur le serveur de dev, d'où les 5-7
  // secondes de "Chargement..." qu'on pouvait voir avant. Les fonctions
  // rafraichirEquipements()/rafraichirTypes() restent utilisées telles
  // quelles après une création/modification (un seul type de donnée à
  // rafraîchir à ce moment-là, pas besoin du bundle complet).
  useEffect(() => {
    setChargement(true);
    apiFetch("/donnees-initiales")
      .then((d) => {
        setEquipements(d.equipements);
        setFiliales(d.filiales);
        setSites(d.sites);
        setTypesEquipement(d.typesEquipement);
        setGroupesEquipement(d.groupesEquipement ?? []);
      })
      .catch(() =>
        // Si /donnees-initiales échoue pour une raison quelconque (route pas
        // encore prise en compte côté serveur, erreur ponctuelle...), on
        // retombe sur les anciens appels séparés plutôt que de laisser les
        // listes déroulantes (filiales/types/groupes) vides pour toute la
        // session.
        Promise.all([
          apiFetch("/equipements").then(setEquipements),
          apiFetch("/filiales").then(setFiliales),
          apiFetch("/sites").then(setSites),
          apiFetch("/type-equipements").then(setTypesEquipement),
          apiFetch("/groupes-equipement").then(setGroupesEquipement),
        ]),
      )
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  function getByRef(ref) {
    if (!ref) return null;
    return (
      equipements.find(
        (e) =>
          String(e.id_equipement).trim().toUpperCase() ===
          String(ref).trim().toUpperCase(),
      ) ?? null
    );
  }

  function sitesDeFiliale(codeFiliale) {
    const filiale = filiales.find((f) => f.code === codeFiliale);
    if (!filiale) return [];
    // String(...) des deux côtés : SQL Server renvoie parfois les id en texte,
    // parfois en nombre, selon la colonne — comparaison stricte (===) échouait.
    return sites.filter(
      (s) => String(s.id_filiale) === String(filiale.id_filiale),
    );
  }

  // L'identifiant (ex. "MP-0007") et le référentiel sont désormais générés
  // par le serveur (voir EquipementController::store) : le calculer ici à
  // partir de la liste chargée en mémoire pouvait entrer en collision avec
  // un équipement déjà créé ailleurs (autre onglet, tests successifs...).
  async function creerEquipement(donnees) {
    const filiale = filiales.find((f) => f.code === donnees.codeFiliale);
    const corps = {
      id_filiale: filiale?.id_filiale,
      id_site: donnees.id_site || null,
      id_type_equipement: donnees.id_type_equipement,
      designation: donnees.designation,
      marque_modele: donnees.marque_modele,
      numero_serie: donnees.numero_serie,
      date_mise_en_service: donnees.date_mise_en_service,
      periodicite_mois: donnees.periodicite_mois || null,
      statut: donnees.statut,
      fabricant: donnees.fabricant || null,
      modele: donnees.modele || null,
      annee_fabrication: donnees.annee_fabrication || null,
      organisme_controle: donnees.organisme_controle || null,
    };
    const cree = await apiFetch("/equipements", {
      method: "POST",
      body: JSON.stringify(corps),
    });
    setEquipements((prev) => [cree, ...prev]);
    return cree;
  }

  async function modifierEquipement(id, donnees) {
    const filiale = donnees.codeFiliale
      ? filiales.find((f) => f.code === donnees.codeFiliale)
      : null;
    const corps = {
      ...(filiale ? { id_filiale: filiale.id_filiale } : {}),
      id_site: donnees.id_site || null,
      id_type_equipement: donnees.id_type_equipement,
      designation: donnees.designation,
      marque_modele: donnees.marque_modele,
      numero_serie: donnees.numero_serie,
      date_mise_en_service: donnees.date_mise_en_service,
      periodicite_mois: donnees.periodicite_mois || null,
      statut: donnees.statut,
      fabricant: donnees.fabricant || null,
      modele: donnees.modele || null,
      annee_fabrication: donnees.annee_fabrication || null,
      organisme_controle: donnees.organisme_controle || null,
    };
    const maj = await apiFetch(`/equipements/${id}`, {
      method: "PUT",
      body: JSON.stringify(corps),
    });
    setEquipements((prev) =>
      prev.map((e) => (e.id_equipement === id ? maj : e)),
    );
    return maj;
  }

  async function modifierDetailsEquipement(id, details) {
    const maj = await apiFetch(`/equipements/${id}`, {
      method: "PUT",
      body: JSON.stringify(details),
    });
    setEquipements((prev) =>
      prev.map((e) => (e.id_equipement === id ? { ...e, ...maj } : e)),
    );
    return maj;
  }

  // Bouton "Supprimer" réservé au super admin dans la liste des équipements
  // (à côté de "Ouvrir"/"Modifier").
  async function supprimerEquipement(id) {
    await apiFetch(`/equipements/${id}`, { method: "DELETE" });
    setEquipements((prev) => prev.filter((e) => e.id_equipement !== id));
  }

  async function creerTypeEquipement({
    libelle,
    categorie,
    periodiciteControle,
    caracteristiques,
  }) {
    const type = await apiFetch("/type-equipements", {
      method: "POST",
      body: JSON.stringify({
        libelle,
        categorie,
        periodicite_controle: periodiciteControle,
        caracteristiques: caracteristiques ?? [],
      }),
    });
    setTypesEquipement((prev) => [...prev, type]);
    return type;
  }

  // Page "Données de base > Types d'équipement".
  async function modifierTypeEquipement(
    id,
    { libelle, categorie, periodiciteControle, caracteristiques },
  ) {
    const type = await apiFetch(`/type-equipements/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        libelle,
        categorie,
        periodicite_controle: periodiciteControle,
        caracteristiques: caracteristiques ?? [],
      }),
    });
    setTypesEquipement((prev) =>
      prev.map((t) => (t.id_type_equipement === id ? type : t)),
    );
    return type;
  }

  async function supprimerTypeEquipement(id) {
    await apiFetch(`/type-equipements/${id}`, { method: "DELETE" });
    setTypesEquipement((prev) =>
      prev.filter((t) => t.id_type_equipement !== id),
    );
  }

  // Page "Données de base > Groupes".
  async function creerGroupeEquipement(libelle) {
    const groupe = await apiFetch("/groupes-equipement", {
      method: "POST",
      body: JSON.stringify({ libelle }),
    });
    setGroupesEquipement((prev) => [...prev, groupe]);
    return groupe;
  }

  async function modifierGroupeEquipement(id, libelle) {
    const groupe = await apiFetch(`/groupes-equipement/${id}`, {
      method: "PUT",
      body: JSON.stringify({ libelle }),
    });
    setGroupesEquipement((prev) =>
      prev.map((g) => (g.id_groupe_equipement === id ? groupe : g)),
    );
    return groupe;
  }

  async function supprimerGroupeEquipement(id) {
    await apiFetch(`/groupes-equipement/${id}`, { method: "DELETE" });
    setGroupesEquipement((prev) =>
      prev.filter((g) => g.id_groupe_equipement !== id),
    );
  }

  function recupererRapports(idEquipement) {
    return apiFetch(`/equipements/${idEquipement}/rapports`);
  }

  async function ajouterRapport(
    idEquipement,
    { dateRapport, organisme, reference, constatations, fichier },
  ) {
    const corps = new FormData();
    corps.append("date_rapport", dateRapport);
    corps.append("organisme", organisme);
    if (reference) corps.append("reference", reference);
    if (constatations) corps.append("constatations", constatations);
    if (fichier) corps.append("fichier", fichier);

    return apiFetch(`/equipements/${idEquipement}/rapports`, {
      method: "POST",
      body: corps,
    });
  }

  async function genererAssistant(idEquipement, cible) {
    const { reponse } = await apiFetch(
      `/equipements/${idEquipement}/assistant/${cible}`,
      { method: "POST" },
    );
    return reponse;
  }

  const value = {
    equipements,
    filiales,
    sites,
    sitesDeFiliale,
    typesEquipement,
    groupesEquipement,
    chargement,
    erreur,
    getByRef,
    creerEquipement,
    modifierEquipement,
    modifierDetailsEquipement,
    supprimerEquipement,
    creerTypeEquipement,
    modifierTypeEquipement,
    supprimerTypeEquipement,
    creerGroupeEquipement,
    modifierGroupeEquipement,
    supprimerGroupeEquipement,
    recupererRapports,
    ajouterRapport,
    genererAssistant,
    rafraichirEquipements,
    rafraichirTypes,
    rafraichirGroupes,
  };

  return (
    <EquipementsContext.Provider value={value}>
      {children}
    </EquipementsContext.Provider>
  );
}

export function useEquipements() {
  const ctx = useContext(EquipementsContext);
  if (!ctx) {
    throw new Error(
      "useEquipements() doit être utilisé à l'intérieur de <EquipementsProvider>.",
    );
  }
  return ctx;
}
