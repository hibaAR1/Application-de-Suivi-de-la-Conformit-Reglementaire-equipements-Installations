import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getControlesEngin,
  creerControleEngin,
  mettreAJourReserveEngin,
} from "../utils/api";
import { useAuth } from "./AuthContext";

/*
 * ============================================================================
 * CONTEXTE : ControlesEnginContext
 * ============================================================================
 *
 * RÔLE
 *   Garde en mémoire les contrôles et les réserves des ENGINS (tables
 *   "controle_engin" / "reserve_engin", séparées de celles des équipements)
 *   et fournit aux écrans les opérations pour les gérer.
 *   Même fonctionnement que ControlesContext ; les constantes (criticités,
 *   résultats, délais) restent celles des équipements, pour une seule source
 *   de vérité côté écran.
 *
 * CE QUE LE CONTEXTE FOURNIT (via useControlesEngin())
 *   - Données : controles, chargement, erreur
 *   - Lecture : reservesDeEngin, rafraichir
 *   - Écriture : ajouterControleEngin, leverReserveEngin,
 *     marquerReserveEnginEnCours
 * ============================================================================
 */

// ------------------------------------------------------------------
// NORMALISATION des données du serveur
// ------------------------------------------------------------------
// Le backend renvoie du snake_case (id_engin, date_controle...) avec un
// tableau "reserves" ; l'écran attend du camelCase et une réserve par contrôle
// (on garde donc seulement la première).
function normaliserControleEngin(c) {
  const premiereReserve =
    c.reserves && c.reserves.length > 0 ? c.reserves[0] : null;
  return {
    id: c.id_controle_engin,
    enginRef: c.id_engin,
    dateControle: c.date_controle,
    organisme: c.organisme_controle,
    resultat: c.resultat_global,
    prochaineEcheance: c.prochaine_echeance,
    reserve: premiereReserve
      ? {
          idReserve: premiereReserve.id_reserve_engin,
          nature: premiereReserve.nature_reserve,
          criticite: premiereReserve.niveau_criticite,
          responsable: premiereReserve.responsable,
          actionCorrective: premiereReserve.action_corrective,
          statut: premiereReserve.statut,
          delaiLevee: premiereReserve.delai_levee,
          justificatif: premiereReserve.justificatif_levee,
          dateLeveeEffective: premiereReserve.date_levee_effective,
        }
      : null,
  };
}

const ControlesEnginContext = createContext(null);

export function ControlesEnginProvider({ children }) {
  const { token } = useAuth();
  const [controles, setControles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // ------------------------------------------------------------------
  // CHARGEMENT de la liste
  // ------------------------------------------------------------------
  const rafraichir = useCallback(async () => {
    setChargement(true);
    try {
      const data = await getControlesEngin();
      setControles(data.map(normaliserControleEngin));
      setErreur(null);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  // Recharge la liste dès que le token change : premier login et reconnexions.
  useEffect(() => {
    if (token) {
      rafraichir();
    } else {
      setControles([]);
      setChargement(false);
    }
  }, [token, rafraichir]);

  // ------------------------------------------------------------------
  // AJOUT d'un contrôle (avec sa réserve éventuelle)
  // ------------------------------------------------------------------
  // Le backend calcule lui-même la prochaine échéance à partir de la
  // périodicité de l'engin. Les données partent en FormData car le rapport
  // peut être un fichier PDF.
  async function ajouterControleEngin({
    enginRef,
    dateControle,
    organisme,
    resultat,
    reserveInfo,
    rapport,
  }) {
    const fd = new FormData();
    fd.append("id_engin", enginRef);
    fd.append("date_controle", dateControle);
    fd.append("organisme_controle", organisme);
    fd.append("resultat_global", resultat);
    if (rapport) fd.append("rapport", rapport); // fichier PDF réel, si fourni

    // La réserve n'est envoyée que si le résultat est "Favorable avec réserves".
    if (resultat === "Favorable avec réserves" && reserveInfo) {
      fd.append("reserves[0][nature_reserve]", reserveInfo.nature);
      fd.append("reserves[0][niveau_criticite]", reserveInfo.criticite);
      if (reserveInfo.responsable)
        fd.append("reserves[0][responsable]", reserveInfo.responsable);
      if (reserveInfo.actionCorrective)
        fd.append(
          "reserves[0][action_corrective]",
          reserveInfo.actionCorrective,
        );
      if (reserveInfo.delaiLevee)
        fd.append("reserves[0][delai_levee]", reserveInfo.delaiLevee);
    }

    // Le nouveau contrôle est ajouté en tête de liste.
    const nouveau = await creerControleEngin(fd);
    const normalise = normaliserControleEngin(nouveau);
    setControles((prev) => [normalise, ...prev]);
    return normalise;
  }

  // ------------------------------------------------------------------
  // LEVÉE d'une réserve (passage à "Clôturée")
  // ------------------------------------------------------------------
  // Envoie le "Justificatif de levée" (fichier) et la "Date de levée
  // effective", puis recharge la liste.
  async function leverReserveEngin(
    controleId,
    { fichier, dateLeveeEffective },
  ) {
    const controle = controles.find((c) => c.id === controleId);
    if (!controle?.reserve?.idReserve) return;

    const fd = new FormData();
    fd.append("statut", "Clôturée");
    fd.append("date_levee_effective", dateLeveeEffective);
    if (fichier) fd.append("justificatif_levee", fichier);

    await mettreAJourReserveEngin(controle.reserve.idReserve, fd);
    await rafraichir();
  }

  // ------------------------------------------------------------------
  // PASSAGE "En cours" d'une réserve
  // ------------------------------------------------------------------
  // Passe une réserve "Ouverte" à "En cours". Prend l'id de la RÉSERVE
  // (pas celui du contrôle).
  async function marquerReserveEnginEnCours(idReserve) {
    const fd = new FormData();
    fd.append("statut", "En cours");
    await mettreAJourReserveEngin(idReserve, fd);
    await rafraichir();
  }

  // Les contrôles d'un engin qui portent une réserve.
  function reservesDeEngin(enginRef) {
    return controles.filter((c) => c.enginRef === enginRef && c.reserve);
  }

  // Tout ce que les écrans peuvent utiliser via useControlesEngin().
  const value = {
    controles,
    chargement,
    erreur,
    ajouterControleEngin,
    leverReserveEngin,
    marquerReserveEnginEnCours,
    reservesDeEngin,
    rafraichir,
  };
  return (
    <ControlesEnginContext.Provider value={value}>
      {children}
    </ControlesEnginContext.Provider>
  );
}

// Raccourci d'accès au contexte, avec une erreur claire en cas d'oubli du
// <ControlesEnginProvider> autour de l'application.
export function useControlesEngin() {
  const ctx = useContext(ControlesEnginContext);
  if (!ctx)
    throw new Error(
      "useControlesEngin() doit être utilisé à l'intérieur de <ControlesEnginProvider>.",
    );
  return ctx;
}
