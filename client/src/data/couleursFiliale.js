// Identité visuelle par filiale, une seule source de vérité (couleur + nom + initiales),
// extraite des 9 guides de charte graphique officiels de Ménara Holding.
export const FILIALES_THEME = {
  MP: { nom: "Ménara Prefa", initiales: "MP", couleur: "#1C294B" },
  CTM: { nom: "CTM", initiales: "CTM", couleur: "#06958F" },
  MT: { nom: "Ménara Transport", initiales: "MT", couleur: "#1B3F8B" },
  ML: { nom: "Ménara Logistique", initiales: "ML", couleur: "#F18C02" },
  TCGM: { nom: "TCGM", initiales: "TCGM", couleur: "#D75F2C" },
  GROUPE: { nom: "Ménara Holding", initiales: "MH", couleur: "#AA9766" },
};

// Gardé pour compatibilité avec le code existant (Dashboard.jsx) qui importe juste les couleurs.
export const COULEURS_FILIALE = Object.fromEntries(
  Object.entries(FILIALES_THEME).map(([code, v]) => [code, v.couleur]),
);
