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

  useEffect(() => {
    rafraichirEquipements();
    apiFetch("/filiales")
      .then(setFiliales)
      .catch((e) => setErreur(e.message));
    apiFetch("/sites")
      .then(setSites)
      .catch((e) => setErreur(e.message));
    rafraichirTypes();
  }, [rafraichirEquipements, rafraichirTypes]);

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
    chargement,
    erreur,
    getByRef,
    creerEquipement,
    modifierEquipement,
    modifierDetailsEquipement,
    creerTypeEquipement,
    recupererRapports,
    ajouterRapport,
    genererAssistant,
    rafraichirEquipements,
    rafraichirTypes,
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
