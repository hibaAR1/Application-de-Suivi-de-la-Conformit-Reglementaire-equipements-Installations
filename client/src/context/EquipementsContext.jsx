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
function genererIdentifiant(codeFiliale, equipementsExistants) {
  const count =
    equipementsExistants.filter((e) =>
      e.id_equipement?.startsWith(`${codeFiliale}-`),
    ).length + 1;
  return `${codeFiliale}-${String(count).padStart(4, "0")}`;
}

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
    return sites.filter((s) => s.id_filiale === filiale.id_filiale);
  }

  async function creerEquipement(donnees) {
    const id_equipement = genererIdentifiant(donnees.codeFiliale, equipements);
    const filiale = filiales.find((f) => f.code === donnees.codeFiliale);
    const corps = {
      id_equipement,
      referentiel: id_equipement,
      id_filiale: filiale?.id_filiale,
      id_site: donnees.id_site || null,
      id_type_equipement: donnees.id_type_equipement,
      designation: donnees.designation,
      marque_modele: donnees.marque_modele,
      numero_serie: donnees.numero_serie,
      date_mise_en_service: donnees.date_mise_en_service,
      statut: donnees.statut,
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
      statut: donnees.statut,
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
