import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconGrid,
  IconBox,
  IconClipboard,
  IconUsers,
  IconLogout,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Tableau de bord", icon: IconGrid, end: true },
  { to: "/equipements", label: "Équipements", icon: IconBox },
  { to: "/controles", label: "Contrôles & réserves", icon: IconClipboard },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const roleLabel = user ? `${user.role} · ${user.filialeLibelle}` : "";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">MH</div>
        <div className="brand-text">
          Ménara Holding
          <span>{roleLabel}</span>
        </div>
      </div>
      <nav>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <item.icon />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        {user?.voitToutesFiliales && (
          <>
            <div className="nav-section-label">Administration</div>
            <NavLink
              to="/groupe"
              title="Vue consolidée Groupe"
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <IconUsers />
              <span className="nav-label">Vue consolidée Groupe</span>
            </NavLink>
          </>
        )}
        {user?.hasPermission("utilisateurs.manage") && (
          <NavLink
            to="/utilisateurs"
            title="Utilisateurs"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <IconUsers />
            <span className="nav-label">Utilisateurs</span>
          </NavLink>
        )}
      </nav>
      <div className="user-badge">
        <div className="user-avatar">{user?.initiales ?? "?"}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="user-name">{user?.nom ?? "Utilisateur"}</div>
          <div className="user-role">{roleLabel}</div>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Se déconnecter"
          style={{
            background: "none",
            border: "none",
            color: "rgba(239,233,223,0.5)",
            cursor: "pointer",
            flexShrink: 0,
            padding: 4,
          }}
        >
          <IconLogout />
        </button>
      </div>
    </aside>
  );
}
