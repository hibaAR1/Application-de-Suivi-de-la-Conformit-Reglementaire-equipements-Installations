import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { LOGOS_FILIALE } from "../../data/logosFiliale";
import ScannerEquipementModal from "../scan/ScannerEquipementModal";
import {
  IconGrid,
  IconBox,
  IconClipboard,
  IconUsers,
  IconLogout,
  IconChevron,
  IconQr,
  IconMenu,
} from "../../components/icons";

const NAV_ITEMS = [
  { to: "/", label: "Tableau de bord", icon: IconGrid, end: true },
  // Anciennement "/equipements/fixes" avec un filtre "Fixe" forcé par défaut
  // (et le libellé "Équipements fixes") : renvoie maintenant vers la liste
  // complète, sans présélection de groupe.
  { to: "/equipements", label: "Équipements", icon: IconBox },
  { to: "/controles", label: "Contrôles & réserves", icon: IconClipboard },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { filialeActive, setFilialeActive, nom, filiales, onglets } =
    useFilialeTheme();
  const location = useLocation();
  // Avant : `${user.role} · ${user.filialeLibelle}` — le nom de la filiale
  // (ex: "Carrières & Transport Ménara") rendait le texte trop long et il
  // était coupé, en haut sous le logo ET en bas à côté de l'avatar (les
  // deux endroits utilisent cette même variable). On ne garde que le rôle.
  const roleLabel = user ? user.role : "";
  const logo = LOGOS_FILIALE[filialeActive] ?? LOGOS_FILIALE.GROUPE;

  // "Données de base" : section repliable dans la sidebar (comme dans
  // l'exemple donné), pas une page à part avec des cartes — on reste ouvert
  // automatiquement si on est déjà sur une de ses sous-pages.
  const [donneesBaseOuvert, setDonneesBaseOuvert] = useState(
    location.pathname.startsWith("/donnees-base"),
  );
  useEffect(() => {
    if (location.pathname.startsWith("/donnees-base")) {
      setDonneesBaseOuvert(true);
    }
  }, [location.pathname]);

  // Bouton "Scanner QR Code", juste sous le sélecteur de filiale (voir
  // capture d'écran fournie) : ouvre ScannerEquipementModal.
  const [scanOuvert, setScanOuvert] = useState(false);

  // Repli manuel du sidebar aux icônes seules (bouton ☰) : "auto" = suit le
  // comportement par défaut selon la largeur d'écran (replié en dessous de
  // 940px, comme avant) ; "ouvert"/"ferme" = l'utilisateur a cliqué, et son
  // choix gagne désormais à n'importe quelle taille d'écran. Mémorisé pour
  // rester fixe d'une page à l'autre et après rechargement. Le bouton est
  // toujours affiché dès le premier rendu (pas derrière une condition de
  // chargement), donc il ne disparaît jamais pendant le chargement d'une page.
  const [etatSidebar, setEtatSidebar] = useState(() => {
    try {
      return localStorage.getItem("sidebarEtat") || "auto";
    } catch {
      return "auto";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("sidebarEtat", etatSidebar);
    } catch {
      // stockage indisponible (navigation privée, etc.) : on ignore
    }
  }, [etatSidebar]);

  const basculerSidebar = () => {
    setEtatSidebar((v) => {
      if (v === "ouvert") return "ferme";
      if (v === "ferme") return "ouvert";
      // Premier clic depuis "auto" : on part de ce qui est visuellement
      // affiché actuellement (replié en dessous de 940px de large) pour que
      // le bouton fasse l'inverse de ce qu'on voit à l'écran.
      return window.innerWidth < 940 ? "ouvert" : "ferme";
    });
  };
  const reduit = etatSidebar === "ferme";
  const classeSidebar =
    etatSidebar === "ferme"
      ? " reduit"
      : etatSidebar === "ouvert"
        ? " agrandi"
        : "";

  return (
    <aside className={`sidebar${classeSidebar}`}>
      <div className="brand">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={basculerSidebar}
          title={reduit ? "Déplier le menu" : "Replier le menu"}
        >
          <IconMenu />
        </button>
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

      {/* Le Référent HSE filiale n'a pas le droit de scanner (demande
          client) : bouton visible seulement pour qui a la permission
          "equipements.scanner" (Super Admin, Administrateur SMI Holding,
          Technicien terrain — voir PermissionSeeder.php). */}
      {user?.hasPermission("equipements.scanner") && (
        <>
          <button
            type="button"
            onClick={() => setScanOuvert(true)}
            className="nav-item"
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              width: "100%",
              margin: "0 0 6px",
              border: "1px dashed rgba(212,175,55,0.4)",
              borderRadius: 8,
            }}
            title="Scanner un équipement"
          >
            <IconQr />
            <span className="nav-label">Scanner QR Code</span>
          </button>
          {scanOuvert && (
            <ScannerEquipementModal onClose={() => setScanOuvert(false)} />
          )}
        </>
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
        {/* Gestion des rôles et de leurs permissions (créer un rôle, cocher
            ses permissions par module, ajouter de nouvelles permissions) —
            réservé aux mêmes comptes que la page Utilisateurs. */}
        {user?.hasPermission("utilisateurs.manage") && (
          <NavLink
            to="/roles"
            title="Rôles & Permissions"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <IconUsers />
            <span className="nav-label">Rôles & Permissions</span>
          </NavLink>
        )}
        {/* "Données de base" (Groupes, Types d'équipement) : utile à quiconque
            crée/modifie des équipements (equipements.create), pas seulement
            à qui gère les comptes utilisateurs — sinon un Référent HSE, qui a
            equipements.create mais pas utilisateurs.manage, ne voyait jamais
            cette section. */}
        {(user?.hasPermission("utilisateurs.manage") ||
          user?.hasPermission("equipements.create")) && (
          <>
            <button
              type="button"
              className="nav-item"
              style={{ cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => setDonneesBaseOuvert((v) => !v)}
              aria-expanded={donneesBaseOuvert}
            >
              <IconBox />
              <span className="nav-label" style={{ flex: 1 }}>
                Données de base
              </span>
              <span
                style={{
                  display: "flex",
                  transform: donneesBaseOuvert ? "rotate(90deg)" : "none",
                  transition: "transform 0.15s",
                }}
              >
                <IconChevron />
              </span>
            </button>
            {donneesBaseOuvert && (
              <div style={{ paddingLeft: 18 }}>
                <NavLink
                  to="/donnees-base/groupes"
                  title="Groupes"
                  className={({ isActive }) =>
                    `nav-item${isActive ? " active" : ""}`
                  }
                  style={{ padding: "8px 11px" }}
                >
                  <span className="nav-label">Groupes</span>
                </NavLink>
                <NavLink
                  to="/donnees-base/types"
                  title="Types d'équipement"
                  className={({ isActive }) =>
                    `nav-item${isActive ? " active" : ""}`
                  }
                  style={{ padding: "8px 11px" }}
                >
                  <span className="nav-label">Types d'équipement</span>
                </NavLink>
              </div>
            )}
          </>
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
