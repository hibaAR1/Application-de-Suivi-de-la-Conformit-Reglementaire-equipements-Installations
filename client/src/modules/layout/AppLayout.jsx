import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useFilialeTheme } from "../../context/FilialeThemeContext";

export default function AppLayout() {
  const { couleur, contraste } = useFilialeTheme();

  // Les popups "Étiquettes QR" et "Scanner QR" sont affichées dans <body>
  // (createPortal), donc EN DEHORS de .app-shell : elles ne recevaient pas
  // la couleur de la filiale et gardaient la couleur dorée par défaut.
  // On applique donc aussi la couleur sur <html>, que tout le document hérite.
  useEffect(() => {
    const racine = document.documentElement;
    racine.style.setProperty("--gold", couleur);
    racine.style.setProperty("--gold-contrast", contraste);
    return () => {
      racine.style.removeProperty("--gold");
      racine.style.removeProperty("--gold-contrast");
    };
  }, [couleur, contraste]);

  return (
    <div
      className="app-shell"
      style={{ "--gold": couleur, "--gold-contrast": contraste }}
    >
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
