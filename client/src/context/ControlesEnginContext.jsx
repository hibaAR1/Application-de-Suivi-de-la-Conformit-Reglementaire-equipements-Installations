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

// Contrôles / réserves des ENGINS (tables "controle_engin" / "reserve_engin",
// séparées de celles des équipements). Même fonctionnement que
// ControlesContext ; les constantes (criticités, résultats, délais) restent
// celles des équipements, pour une seule source de vérité côté écran.

// Le backend renvoie du snake_case (id_engin, date_controle...) avec un
// tableau "reserves" ; l'écran attend du camelCase et une réserve par contrôle.
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

  // Saisie d'un contrôle d'engin : le backend calcule lui-même la
  // prochaine échéance à partir de la périodicité de l'engin.
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

    const nouveau = await creerControleEngin(fd);
    const normalise = normaliserControleEngin(nouveau);
    setControles((prev) => [normalise, ...prev]);
    return normalise;
  }

  // "Justificatif de levée" + "Date de levée effective".
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

  // Passe une réserve "Ouverte" à "En cours". Prend l'id de la RÉSERVE
  // (pas celui du contrôle).
  async function marquerReserveEnginEnCours(idReserve) {
    const fd = new FormData();
    fd.append("statut", "En cours");
    await mettreAJourReserveEngin(idReserve, fd);
    await rafraichir();
  }

  function reservesDeEngin(enginRef) {
    return controles.filter((c) => c.enginRef === enginRef && c.reserve);
  }

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

export function useControlesEngin() {
  const ctx = useContext(ControlesEnginContext);
  if (!ctx)
    throw new Error(
      "useControlesEngin() doit être utilisé à l'intérieur de <ControlesEnginProvider>.",
    );
  return ctx;
}
