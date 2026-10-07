import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { FilialeThemeProvider } from "./context/FilialeThemeContext";
import { ControlesProvider } from "./context/ControlesContext";
import { ControlesEnginProvider } from "./context/ControlesEnginContext";
import { EquipementsProvider } from "./context/EquipementsContext";
import { EnginsProvider } from "./context/EnginsContext";
import "./styles/tokens.css";

/*
 * ============================================================================
 * POINT D'ENTRÉE : démarrage de l'application React
 * ============================================================================
 *
 * RÔLE
 *   Monte l'application dans la page (<div id="root">) et l'entoure des
 *   contextes (données partagées) dont tous les écrans ont besoin.
 *
 * ORDRE DES CONTEXTES (du plus extérieur au plus intérieur)
 *   Un contexte ne peut utiliser que ceux qui l'entourent :
 *   1. AuthProvider          : utilisateur connecté et jeton
 *   2. EquipementsProvider   : équipements et listes communes (filiales,
 *                              sites, types)
 *   3. FilialeThemeProvider  : filiale active et couleurs associées
 *   4. ControlesProvider     : contrôles et réserves des équipements
 *   5. EnginsProvider        : engins (utilise les filiales d'EquipementsProvider)
 *   6. ControlesEnginProvider: contrôles et réserves des engins
 * ============================================================================
 */

// StrictMode est volontairement absent : en développement, il monte puis
// démonte chaque composant deux fois pour détecter les effets mal nettoyés.
// La caméra du scanner QR (Html5QrcodeScanner, voir ScannerEquipementModal.jsx
// et ScanSimule.jsx) ne supporte pas ce double montage : elle afficherait deux
// jeux de boutons "Stop Scanning" et une erreur DOM. En production StrictMode
// n'a aucun effet : son retrait ne change donc que le mode développement
// (npm run dev).
createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <EquipementsProvider>
      <FilialeThemeProvider>
        <ControlesProvider>
          <EnginsProvider>
            <ControlesEnginProvider>
              <App />
            </ControlesEnginProvider>
          </EnginsProvider>
        </ControlesProvider>
      </FilialeThemeProvider>
    </EquipementsProvider>
  </AuthProvider>,
);
