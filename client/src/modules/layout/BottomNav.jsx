import { NavLink } from "react-router-dom";
import { IconGrid, IconBox, IconAlert } from "../../components/icons";

// L'assistant réglementaire est accessible via le widget flottant (bouton bas-gauche),
// pas via cette barre — on garde ici les usages quotidiens uniquement.
// "Groupe" (Vue consolidée Groupe) supprimée — Phase 8.
const ITEMS = [
  { to: "/", label: "Bord", icon: IconGrid, end: true },
  { to: "/equipements", label: "Équip.", icon: IconBox },
  { to: "/reserves", label: "Réserves", icon: IconAlert },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <item.icon />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
