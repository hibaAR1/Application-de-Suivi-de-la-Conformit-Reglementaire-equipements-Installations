import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { FilialeThemeProvider } from "./context/FilialeThemeContext";
import { ControlesProvider } from "./context/ControlesContext";
import { ControlesEnginProvider } from "./context/ControlesEnginContext";
import { EquipementsProvider } from "./context/EquipementsContext";
import { EnginsProvider } from "./context/EnginsContext";
import "./styles/tokens.css";

// StrictMode retiré : en développement, il monte/démonte chaque composant
// deux fois de suite pour détecter les effets mal nettoyés. La caméra du
// scanner QR (Html5QrcodeScanner, voir ScannerEquipementModal.jsx et
// ScanSimule.jsx) ne supporte pas ce double montage — elle insérait deux
// jeux de boutons "Stop Scanning" et affichait une erreur DOM. StrictMode
// n'a aucun effet en production ; le retirer n'a donc pas d'impact une fois
// l'application construite pour de vrai, seulement en dev (npm run dev).
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
