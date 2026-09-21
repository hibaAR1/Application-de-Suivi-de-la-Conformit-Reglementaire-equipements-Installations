import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../utils/api";

// §3.2 du CDC : délais de levée par criticité — le CDC dit juste "Selon
// criticité" sans chiffrer les valeurs. À faire valider avec la Direction SMI ;
// en attendant, valeurs plausibles pour que la logique tourne.
export const DELAI_LEVEE_PAR_CRITICITE = {
  Bloquante: 7,
  Majeure: 30,
  Mineure: 90,
};
export const NIVEAUX_CRITICITE = Object.keys(DELAI_LEVEE_PAR_CRITICITE);
export const RESULTATS_CONTROLE = [
  "Favorable",
  "Favorable avec réserves",
  "Défavorable",
];

function ajouterJours(dateISO, jours) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

const ControlesContext = createContext(null);

export function ControlesProvider({ children }) {
  const [controles, setControles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const rafraichir = useCallback(() => {
    setChargement(true);
    return apiFetch("/controles")
      .then(setControles)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  // §3.2 : saisie d'un contrôle (Technicien terrain, via scan QR code).
  // periodiciteEquipement vient de equipement.type_equipement.periodicite_mois.
  async function ajouterControle({
    id_equipement,
    dateControle,
    organisme,
    resultat,
    rapportNom,
    reserveInfo,
    periodiciteEquipement,
  }) {
    const controle = await apiFetch("/controles", {
      method: "POST",
      body: JSON.stringify({
        id_equipement,
        date_controle: dateControle,
        organisme_controle: organisme,
        resultat_global: resultat,
        rapport_controle: rapportNom ?? null,
        periodicite_mois: periodiciteEquipement,
      }),
    });

    let reserve = null;
    if (resultat === "Favorable avec réserves" && reserveInfo) {
      reserve = await apiFetch("/reserves", {
        method: "POST",
        body: JSON.stringify({
          id_controle: controle.id_controle,
          nature_reserve: reserveInfo.nature,
          niveau_criticite: reserveInfo.criticite,
          delai_levee: ajouterJours(
            dateControle,
            DELAI_LEVEE_PAR_CRITICITE[reserveInfo.criticite],
          ),
        }),
      });
    }

    const complet = { ...controle, reserves: reserve ? [reserve] : [] };
    setControles((prev) => [complet, ...prev]);
    return complet;
  }

  // §3.2 : "Justificatif de levée" (fichier) + "Date de levée effective" — passe la réserve à "Levée".
  async function leverReserve(
    idReserve,
    { justificatifNom, dateLeveeEffective },
  ) {
    const reserve = await apiFetch(`/reserves/${idReserve}`, {
      method: "PUT",
      body: JSON.stringify({
        statut: "Levée",
        justificatif_levee: justificatifNom,
        date_levee_effective: dateLeveeEffective,
      }),
    });
    setControles((prev) =>
      prev.map((c) => ({
        ...c,
        reserves: (c.reserves ?? []).map((r) =>
          r.id_reserve === idReserve ? reserve : r,
        ),
      })),
    );
    return reserve;
  }

  const value = {
    controles,
    chargement,
    erreur,
    ajouterControle,
    leverReserve,
    rafraichir,
  };
  return (
    <ControlesContext.Provider value={value}>
      {children}
    </ControlesContext.Provider>
  );
}

export function useControles() {
  const ctx = useContext(ControlesContext);
  if (!ctx)
    throw new Error(
      "useControles() doit être utilisé à l'intérieur de <ControlesProvider>.",
    );
  return ctx;
}
