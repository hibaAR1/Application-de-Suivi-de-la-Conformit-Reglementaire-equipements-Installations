import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "./AuthContext";
import { useEquipements } from "./EquipementsContext";

// Engins (matériel mobile) : table "engin", séparée de "equipement" côté
// serveur. Ce contexte gère leur liste et leurs opérations (création,
// modification, suppression, rapports, assistant). Les listes communes
// (filiales, sites, types) viennent de EquipementsContext.
const EnginsContext = createContext(null);

export function EnginsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { filiales } = useEquipements();
  const [engins, setEngins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const rafraichirEngins = useCallback(() => {
    return apiFetch("/engins")
      .then((liste) => {
        setEngins(liste);
        setErreur(null);
      })
      .catch((e) => setErreur(e.message));
  }, []);

  // Chargement au démarrage et à chaque connexion (comme EquipementsContext).
  useEffect(() => {
    if (!isAuthenticated) {
      setEngins([]);
      setChargement(false);
      return;
    }
    setChargement(true);
    rafraichirEngins().finally(() => setChargement(false));
  }, [isAuthenticated, rafraichirEngins]);

  function getEnginByRef(ref) {
    if (!ref) return null;
    return (
      engins.find(
        (e) =>
          String(e.id_engin).trim().toUpperCase() ===
          String(ref).trim().toUpperCase(),
      ) ?? null
    );
  }

  // L'identifiant et le référentiel sont générés par le serveur
  // (voir EnginController::store).
  async function creerEngin(donnees) {
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
    const cree = await apiFetch("/engins", {
      method: "POST",
      body: JSON.stringify(corps),
    });
    setEngins((prev) => [cree, ...prev]);
    return cree;
  }

  async function modifierEngin(id, donnees) {
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
    const maj = await apiFetch(`/engins/${id}`, {
      method: "PUT",
      body: JSON.stringify(corps),
    });
    setEngins((prev) => prev.map((e) => (e.id_engin === id ? maj : e)));
    return maj;
  }

  // Fiche de l'engin (onglets Informations / Caractéristiques) : mise à jour
  // partielle de quelques champs seulement.
  async function modifierDetailsEngin(id, details) {
    const maj = await apiFetch(`/engins/${id}`, {
      method: "PUT",
      body: JSON.stringify(details),
    });
    setEngins((prev) =>
      prev.map((e) => (e.id_engin === id ? { ...e, ...maj } : e)),
    );
    return maj;
  }

  // Mêmes permissions que les équipements ("equipements.delete"), réutilisées.
  async function supprimerEngin(id) {
    await apiFetch(`/engins/${id}`, { method: "DELETE" });
    setEngins((prev) => prev.filter((e) => e.id_engin !== id));
  }

  function recupererRapportsEngin(idEngin) {
    return apiFetch(`/engins/${idEngin}/rapports`);
  }

  async function ajouterRapportEngin(
    idEngin,
    { dateRapport, organisme, reference, constatations, fichier },
  ) {
    const corps = new FormData();
    corps.append("date_rapport", dateRapport);
    corps.append("organisme", organisme);
    if (reference) corps.append("reference", reference);
    if (constatations) corps.append("constatations", constatations);
    if (fichier) corps.append("fichier", fichier);

    return apiFetch(`/engins/${idEngin}/rapports`, {
      method: "POST",
      body: corps,
    });
  }

  async function genererAssistantEngin(idEngin, cible) {
    const { reponse } = await apiFetch(
      `/engins/${idEngin}/assistant/${cible}`,
      { method: "POST" },
    );
    return reponse;
  }

  const value = {
    engins,
    chargement,
    erreur,
    getEnginByRef,
    creerEngin,
    modifierEngin,
    modifierDetailsEngin,
    supprimerEngin,
    recupererRapportsEngin,
    ajouterRapportEngin,
    genererAssistantEngin,
    rafraichirEngins,
  };

  return (
    <EnginsContext.Provider value={value}>{children}</EnginsContext.Provider>
  );
}

export function useEngins() {
  const ctx = useContext(EnginsContext);
  if (!ctx) {
    throw new Error(
      "useEngins() doit être utilisé à l'intérieur de <EnginsProvider>.",
    );
  }
  return ctx;
}
