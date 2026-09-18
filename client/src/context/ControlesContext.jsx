import { createContext, useContext, useState } from 'react';

// Règles métier du CDC §3.2 :
// - "Prochaine échéance... Date contrôle + périodicité réglementaire" (calculée)
// - "Délai de levée réglementaire... Selon criticité" (calculée)
//
// ⚠️ Les délais ci-dessous (7/30/90 jours) NE SONT PAS chiffrés dans le CDC —
// il dit juste "selon criticité" sans donner les valeurs. À faire valider avec
// la Direction SMI ; en attendant, valeurs plausibles pour que la logique tourne.
export const DELAI_LEVEE_PAR_CRITICITE = { Bloquante: 7, Majeure: 30, Mineure: 90 };
export const NIVEAUX_CRITICITE = Object.keys(DELAI_LEVEE_PAR_CRITICITE);
export const RESULTATS_CONTROLE = ['Favorable', 'Favorable avec réserves', 'Défavorable'];

function ajouterMois(dateISO, mois) {
  const d = new Date(dateISO);
  d.setMonth(d.getMonth() + mois);
  return d.toISOString().slice(0, 10);
}
function ajouterJours(dateISO, jours) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

const SEED = [
  {
    id: 1, equipementRef: 'CTM-0057',
    dateControle: '2026-03-05', organisme: 'SGS Maroc', resultat: 'Défavorable',
    prochaineEcheance: '2026-09-05', reserve: null,
  },
  {
    id: 2, equipementRef: 'CTM-0142',
    dateControle: '2026-04-08', organisme: 'SGS Maroc', resultat: 'Favorable avec réserves',
    prochaineEcheance: '2026-10-02',
    reserve: {
      nature: 'Câble de levage à contrôler', criticite: 'Majeure', statut: 'Ouverte',
      delaiLevee: ajouterJours('2026-04-08', 30), justificatif: null, dateLeveeEffective: null,
    },
  },
  {
    id: 3, equipementRef: 'CTM-0089',
    dateControle: '2026-05-12', organisme: 'Bureau Véritas', resultat: 'Favorable avec réserves',
    prochaineEcheance: '2026-09-17',
    reserve: {
      nature: 'Étiquetage manquant', criticite: 'Mineure', statut: 'En cours',
      delaiLevee: ajouterJours('2026-05-12', 90), justificatif: null, dateLeveeEffective: null,
    },
  },
  {
    id: 4, equipementRef: 'CTM-0201',
    dateControle: '2026-06-20', organisme: 'Apave', resultat: 'Favorable',
    prochaineEcheance: '2026-10-17', reserve: null,
  },
];

const ControlesContext = createContext(null);

export function ControlesProvider({ children }) {
  const [controles, setControles] = useState(SEED);

  // §3.2 : saisie d'un contrôle (Technicien terrain, via scan QR).
  // periodiciteEquipement vient de la fiche équipement liée (TypeEquipement, cf. diagramme de classes).
  function ajouterControle({ equipementRef, dateControle, organisme, resultat, reserveInfo, periodiciteEquipement }) {
    const prochaineEcheance = ajouterMois(dateControle, periodiciteEquipement);
    let reserve = null;
    if (resultat === 'Favorable avec réserves' && reserveInfo) {
      reserve = {
        nature: reserveInfo.nature,
        criticite: reserveInfo.criticite,
        statut: 'Ouverte',
        delaiLevee: ajouterJours(dateControle, DELAI_LEVEE_PAR_CRITICITE[reserveInfo.criticite]),
        justificatif: null,
        dateLeveeEffective: null,
      };
    }
    const nouveau = { id: Date.now(), equipementRef, dateControle, organisme, resultat, prochaineEcheance, reserve };
    setControles((prev) => [nouveau, ...prev]);
    return nouveau;
  }

  // §3.2 : "Justificatif de levée" + "Date de levée effective" — la réserve passe à "Levée".
  function leverReserve(controleId, { justificatifNom, dateLeveeEffective }) {
    setControles((prev) =>
      prev.map((c) =>
        c.id === controleId && c.reserve
          ? { ...c, reserve: { ...c.reserve, statut: 'Levée', justificatif: justificatifNom, dateLeveeEffective } }
          : c,
      ),
    );
  }

  function reservesDe(equipementRef) {
    return controles.filter((c) => c.equipementRef === equipementRef && c.reserve);
  }

  const value = { controles, ajouterControle, leverReserve, reservesDe };
  return <ControlesContext.Provider value={value}>{children}</ControlesContext.Provider>;
}

export function useControles() {
  const ctx = useContext(ControlesContext);
  if (!ctx) throw new Error('useControles() doit être utilisé à l\'intérieur de <ControlesProvider>.');
  return ctx;
}
