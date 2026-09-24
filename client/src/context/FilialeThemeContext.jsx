import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useEquipements } from "./EquipementsContext";
import { FILIALES_THEME } from "../data/couleursFiliale";

const FilialeThemeContext = createContext(null);

// Calcule la luminance relative (norme WCAG) d'une couleur hex, pour choisir automatiquement
// un texte blanc OU sombre qui reste lisible dessus — évite le texte noir invisible
// sur un bleu marine (Ménara Prefa) ou un bleu foncé (Ménara Transport).
function luminanceRelative(hex) {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map(
    (i) => parseInt(c.substring(i, i + 2), 16) / 255,
  );
  const lin = (v) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function texteLisible(hexFond) {
  const lFond = luminanceRelative(hexFond);
  const contrasteBlanc = 1.05 / (lFond + 0.05);
  const contrasteNoir = (lFond + 0.05) / 0.05;
  return contrasteBlanc > contrasteNoir ? "#FFFFFF" : "#1C1917";
}

export function FilialeThemeProvider({ children }) {
  const { user } = useAuth();
  // La liste des filiales vient désormais d'EquipementsContext (chargée en
  // une fois via /donnees-initiales) au lieu d'un appel /filiales séparé ici.
  // Avant, les deux appels partaient en même temps au chargement/F5 : le
  // sélecteur de filiale de la Sidebar (qui a besoin de cette liste pour
  // s'afficher, voir onglets ci-dessous) pouvait rester cette fraction de
  // seconde sans rien afficher le temps que CE second appel réponde, donnant
  // l'impression que la liste déroulante "ne s'affiche pas" après F5.
  const { filiales } = useEquipements();
  const [filialeActive, setFilialeActive] = useState(null);

  useEffect(() => {
    if (!user) {
      setFilialeActive(null);
      return;
    }
    setFilialeActive(
      (prev) => prev ?? (user.voitToutesFiliales ? "GROUPE" : user.filialeCode),
    );
  }, [user]);

  // Filiales que l'utilisateur a le droit de consulter (+ "GROUPE" si vue consolidée)
  const onglets = user?.voitToutesFiliales
    ? [...filiales.map((f) => f.code), "GROUPE"]
    : user?.filialesCodes?.length
      ? user.filialesCodes
      : user?.filialeCode
        ? [user.filialeCode]
        : [];

  const theme = FILIALES_THEME[filialeActive] ?? FILIALES_THEME.GROUPE;
  const contraste = texteLisible(theme.couleur);

  const value = {
    filialeActive,
    setFilialeActive,
    filiales,
    onglets,
    couleur: theme.couleur,
    nom: theme.nom,
    initiales: theme.initiales,
    contraste,
  };

  return (
    <FilialeThemeContext.Provider value={value}>
      {children}
    </FilialeThemeContext.Provider>
  );
}

export function useFilialeTheme() {
  return useContext(FilialeThemeContext);
}
