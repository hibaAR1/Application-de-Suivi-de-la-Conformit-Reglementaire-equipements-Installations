import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { FILIALES_THEME } from "../data/couleursFiliale";
import { apiFetch } from "../utils/api";

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
  const [filialeActive, setFilialeActive] = useState(null);
  const [filiales, setFiliales] = useState([]);

  useEffect(() => {
    if (!user) {
      setFilialeActive(null);
      return;
    }
    setFilialeActive(
      (prev) => prev ?? (user.voitToutesFiliales ? "GROUPE" : user.filialeCode),
    );
  }, [user]);

  // Charge la liste complète des filiales (codes + libellés) une seule fois ici,
  // pour que n'importe quel composant (Sidebar, Dashboard...) puisse afficher
  // le sélecteur de filiale sans refaire l'appel API de son côté.
  useEffect(() => {
    if (!user) return;
    apiFetch("/filiales")
      .then(setFiliales)
      .catch(() => {});
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
