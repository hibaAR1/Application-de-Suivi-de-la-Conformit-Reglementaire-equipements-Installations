import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import AssistantWidget from "./AssistantWidget";
import { useFilialeTheme } from "../context/FilialeThemeContext";

export default function AppLayout() {
  const { couleur, contraste } = useFilialeTheme();

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
      <AssistantWidget />
    </div>
  );
}
