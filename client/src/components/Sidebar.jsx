import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFilialeTheme } from "../context/FilialeThemeContext";
import { LOGOS_FILIALE } from "../data/logosFiliale";
import {
  IconGrid,
  IconBox,
  IconClipboard,
  IconUsers,
  IconLogout,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Tableau de bord", icon: IconGrid, end: true },
  { to: "/equipements/fixes", label: "Équipements fixes", icon: IconBox },
  { to: "/controles", label: "Contrôles & réserves", icon: IconClipboard },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { filialeActive, setFilialeActive, nom, filiales, onglets } =
    useFilialeTheme();
  const roleLabel = user ? `${user.role} · ${user.filialeLibelle}` : "";
  const logo = LOGOS_FILIALE[filialeActive] ?? LOGOS_FILIALE.GROUPE;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <img src={logo} alt={nom} />
        </div>
        <div className="brand-text">
          {nom}
          <span>{roleLabel}</span>
        </div>
      </div>

      {onglets.length > 1 && (
        <select
          value={filialeActive ?? ""}
          onChange={(e) => setFilialeActive(e.target.value)}
          className="filiale-select"
          title="Changer de filiale"
        >
          {onglets.map((code) => (
            <option key={code} value={code}>
              {code === "GROUPE"
                ? "Toutes les filiales (Groupe)"
                : (filiales.find((f) => f.code === code)?.libelle ?? code)}
            </option>
          ))}
        </select>
      )}

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
