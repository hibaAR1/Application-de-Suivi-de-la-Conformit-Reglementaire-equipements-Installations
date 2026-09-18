// Données factices restantes après le passage aux vrais magasins
// (EquipementsContext, ControlesContext) pour Équipements/Contrôles/Dashboard.
// Ce fichier ne sert plus qu'à la page Groupe (comparatif inter-filiales) —
// à remplacer par un vrai appel API agrégé une fois le backend prêt.

export const FILIALES = [
  { code: 'MP', nom: 'Ménara Prefa', taux: 91, retard: 0, ouvertes: 2 },
  { code: 'CTM', nom: 'CTM', taux: 87, retard: 1, ouvertes: 4 },
  { code: 'MT', nom: 'MT', taux: 78, retard: 2, ouvertes: 6 },
  { code: 'ML', nom: 'ML', taux: 94, retard: 0, ouvertes: 1 },
  { code: 'TCGM', nom: 'TCGM', taux: 83, retard: 1, ouvertes: 3 },
];
