import { createContext, useContext, useState } from "react";

export const PERIODICITE_PAR_DEFAUT = {
  "Engin mobile": 12,
  "Installation électrique": 12,
  "Appareil de levage": 6,
  "Équipement sous pression": 12,
  Autre: 12,
};

export const TYPES_EQUIPEMENT = Object.keys(PERIODICITE_PAR_DEFAUT);
export const FILIALES_CODES = ["MP", "CTM", "MT", "ML", "TCGM"];
export const STATUTS_EQUIPEMENT = [
  "En service",
  "Hors service",
  "En réserve",
  "Réformé",
];

const SEED = [
  {
    ref: "CTM-0089",
    filiale: "CTM",
    typeEquipement: "Installation électrique",
    designation: "Armoire électrique HT — atelier 1",
    marqueModele: "Schneider Prisma",
    numeroSerie: "SC-2017-8842",
    dateMiseEnService: "2017-11-02",
    periodiciteControle: 12,
    statut: "En service",
  },
  {
    ref: "CTM-0142",
    filiale: "CTM",
    typeEquipement: "Appareil de levage",
    designation: "Pont roulant 5T",
    marqueModele: "Demag DR-5000",
    numeroSerie: "DM-2019-3311",
    dateMiseEnService: "2019-03-12",
    periodiciteControle: 6,
    statut: "En service",
  },
  {
    ref: "CTM-0057",
    filiale: "CTM",
    typeEquipement: "Équipement sous pression",
    designation: "Compresseur sous pression",
    marqueModele: "Atlas Copco GA30",
    numeroSerie: "AC-2015-1190",
    dateMiseEnService: "2015-06-20",
    periodiciteControle: 12,
    statut: "En service",
  },
  {
    ref: "CTM-0201",
    filiale: "CTM",
    typeEquipement: "Engin mobile",
    designation: "Chariot élévateur",
    marqueModele: "Toyota 8FG25",
    numeroSerie: "TY-2021-0044",
    dateMiseEnService: "2021-01-15",
    periodiciteControle: 12,
    statut: "En service",
  },
];

function genererIdentifiant(filiale, equipementsExistants) {
  const count =
    equipementsExistants.filter((e) => e.filiale === filiale).length + 1;
  return `${filiale}-${String(count).padStart(4, "0")}`;
}

const EquipementsContext = createContext(null);

export function EquipementsProvider({ children }) {
  const [equipements, setEquipements] = useState(SEED);

  function getByRef(ref) {
    if (!ref) return null;
    return (
      equipements.find(
        (e) => e.ref.trim().toUpperCase() === ref.trim().toUpperCase(),
      ) ?? null
    );
  }

  function creerEquipement(donnees) {
    const ref = genererIdentifiant(donnees.filiale, equipements);
    const nouveau = { ref, ...donnees };
    setEquipements((prev) => [nouveau, ...prev]);
    return nouveau;
  }

  function modifierEquipement(ref, donnees) {
    setEquipements((prev) =>
      prev.map((e) => (e.ref === ref ? { ...e, ...donnees } : e)),
    );
  }

  const value = { equipements, getByRef, creerEquipement, modifierEquipement };

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
