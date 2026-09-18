import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ControlesProvider } from "./context/ControlesContext";
import { EquipementsProvider } from "./context/EquipementsContext";
import "./styles/tokens.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <EquipementsProvider>
        <ControlesProvider>
          <App />
        </ControlesProvider>
      </EquipementsProvider>
    </AuthProvider>
  </StrictMode>,
);
