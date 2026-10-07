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

/*
 * ============================================================================
 * CONTEXTE : EnginsContext
 * ============================================================================
 *
 * RÔLE
 *   Garde en mémoire la liste des ENGINS (matériel mobile, table "engin",
 *   séparée de "equipement" côté serveur) et fournit à tous les écrans les
 *   opérations pour les gérer.
 *
 * CE QUE LE CONTEXTE FOURNIT (via useEngins())
 *   - Données : engins, chargement, erreur
 *   - Lecture : getEnginByRef, rafraichirEngins
 *   - Écriture : creerEngin, modifierEngin, modifierDetailsEngin,
 *     supprimerEngin
 *   - Rapports PDF : recupererRapportsEngin, ajouterRapportEngin
 *   - Assistant IA : genererAssistantEngin
 *
 * Les listes communes (filiales, sites, types) viennent de
 * EquipementsContext. Les contrôles et réserves des engins sont gérés dans
 * ControlesEnginContext.
 * ============================================================================
 */
const EnginsContext = createContext(null);

export function EnginsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { filiales } = useEquipements();
  const [engins, setEngins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // ------------------------------------------------------------------
  // CHARGEMENT de la liste
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // LECTURE : retrouve un engin par son identifiant (sans tenir compte des
  // majuscules ni des espaces autour)
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // CRÉATION d'un engin
  // ------------------------------------------------------------------
  // L'identifiant et le référentiel sont générés par le serveur
  // (voir EnginController::store). Le formulaire donne le code de la
  // filiale ; le serveur attend son identifiant, d'où la recherche ci-dessous.
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
    // Le nouvel engin est ajouté en tête de liste.
    setEngins((prev) => [cree, ...prev]);
    return cree;
  }

  // ------------------------------------------------------------------
  // MODIFICATION complète (formulaire de modification)
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // MODIFICATION partielle (fiche de l'engin)
  // ------------------------------------------------------------------
  // Onglets Informations / Caractéristiques : seuls quelques champs sont
  // envoyés, on fusionne donc la réponse avec l'engin déjà en mémoire.
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

  // ------------------------------------------------------------------
  // SUPPRESSION
  // ------------------------------------------------------------------
  // Mêmes permissions que les équipements ("equipements.delete"), réutilisées.
  async function supprimerEngin(id) {
    await apiFetch(`/engins/${id}`, { method: "DELETE" });
    setEngins((prev) => prev.filter((e) => e.id_engin !== id));
  }

  // ------------------------------------------------------------------
  // RAPPORTS PDF d'un engin
  // ------------------------------------------------------------------
  function recupererRapportsEngin(idEngin) {
    return apiFetch(`/engins/${idEngin}/rapports`);
  }

  async function ajouterRapportEngin(
    idEngin,
    { dateRapport, organisme, reference, constatations, fichier },
  ) {
    // FormData car le rapport peut contenir un fichier PDF ; les champs
    // facultatifs ne sont envoyés que s'ils sont remplis.
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

  // ------------------------------------------------------------------
  // ASSISTANT IA : "cible" vaut "plan-action" ou "points-controle"
  // ------------------------------------------------------------------
  async function genererAssistantEngin(idEngin, cible) {
    const { reponse } = await apiFetch(
      `/engins/${idEngin}/assistant/${cible}`,
      { method: "POST" },
    );
    return reponse;
  }

  // Tout ce que les écrans peuvent utiliser via useEngins().
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

// Raccourci d'accès au contexte, avec une erreur claire en cas d'oubli du
// <EnginsProvider> autour de l'application.
export function useEngins() {
  const ctx = useContext(EnginsContext);
  if (!ctx) {
    throw new Error(
      "useEngins() doit être utilisé à l'intérieur de <EnginsProvider>.",
    );
  }
  return ctx;
}