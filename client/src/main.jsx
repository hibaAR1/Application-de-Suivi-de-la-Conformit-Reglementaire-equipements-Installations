import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { FilialeThemeProvider } from "./context/FilialeThemeContext";
import { ControlesProvider } from "./context/ControlesContext";
import { EquipementsProvider } from "./context/EquipementsContext";
import "./styles/tokens.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <FilialeThemeProvider>
        <EquipementsProvider>
          <ControlesProvider>
            <App />
          </ControlesProvider>
        </EquipementsProvider>
      </FilialeThemeProvider>
    </AuthProvider>
  </StrictMode>,
);