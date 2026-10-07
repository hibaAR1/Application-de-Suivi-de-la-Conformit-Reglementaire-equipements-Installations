/*
 * ============================================================================
 * MENU LATÉRAL (Sidebar)
 * ============================================================================
 *
 * RÔLE
 *   Menu affiché à gauche de toutes les pages connectées.
 *
 * CONTENU, DE HAUT EN BAS
 *   1. Logo et nom de la filiale active, avec le rôle de l'utilisateur
 *   2. Sélecteur de filiale (si l'utilisateur peut en voir plusieurs)
 *   3. Boutons "Scanner QR Code" et "Étiquettes QR" (permission
 *      "equipements.scanner")
 *   4. Liens principaux : tableau de bord, équipements, engins, réserves
 *   5. Section "Administration" (selon les permissions) : utilisateurs,
 *      rôles et permissions, données de base (groupes et types)
 *   6. Badge de l'utilisateur connecté et bouton de déconnexion
 *
 * Le menu peut se replier aux icônes seules (bouton ☰) ; ce choix est
 * mémorisé dans le navigateur.
 * ============================================================================
 */
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { LOGOS_FILIALE } from "../../data/logosFiliale";
import EtiquettesQr from "../equipements/EtiquettesQr";
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
  IconAlert,
} from "../../components/icons";

// Liens principaux du menu (visibles par tous les utilisateurs connectés).
// "end: true" : le lien n'est actif que sur son adresse exacte, pas sur ses
// sous-pages.
const NAV_ITEMS = [
  { to: "/", label: "Tableau de bord", icon: IconGrid, end: true },
  { to: "/equipements", label: "Équipements", icon: IconBox },
  { to: "/engins-mobiles", label: "Engins ", icon: IconClipboard, end: true },
  { to: "/reserves", label: "Réserves & Plan d'action", icon: IconAlert },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { filialeActive, setFilialeActive, nom, filiales, onglets } =
    useFilialeTheme();
  const location = useLocation();
  // Texte affiché sous le logo et à côté de l'avatar : seulement le rôle.
  // Le nom de la filiale rendrait le texte trop long (il serait coupé aux
  // deux endroits qui utilisent cette variable).
  const roleLabel = user ? user.role : "";
  const logo = LOGOS_FILIALE[filialeActive] ?? LOGOS_FILIALE.GROUPE;

  // ------------------------------------------------------------------
  // ÉTAT : section repliable "Données de base"
  // ------------------------------------------------------------------
  // C'est une section dépliable du menu (pas une page à part). Elle reste
  // ouverte automatiquement quand on est sur une de ses sous-pages.
  const [donneesBaseOuvert, setDonneesBaseOuvert] = useState(
    location.pathname.startsWith("/donnees-base"),
  );
  useEffect(() => {
    if (location.pathname.startsWith("/donnees-base")) {
      setDonneesBaseOuvert(true);
    }
  }, [location.pathname]);

  // ------------------------------------------------------------------
  // ÉTAT : fenêtres "Scanner QR Code" et "Étiquettes QR"
  // ------------------------------------------------------------------
  // Chacune est une fenêtre ouverte par-dessus la page (un simple état
  // ouvert/fermé, pas une route).
  const [scanOuvert, setScanOuvert] = useState(false);
  const [etiquettesQrOuvert, setEtiquettesQrOuvert] = useState(false);

  // ------------------------------------------------------------------
  // ÉTAT : repli du menu aux icônes seules (bouton ☰)
  // ------------------------------------------------------------------
  // - "auto"   : suit la largeur de l'écran (replié en dessous de 940px)
  // - "ouvert" / "ferme" : choix de l'utilisateur, prioritaire à toute
  //   largeur d'écran
  // Le choix est mémorisé pour rester le même d'une page à l'autre et après
  // un rechargement. Le bouton est affiché dès le premier rendu (sans
  // condition de chargement), donc il ne disparaît jamais.
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
      // Premier clic depuis "auto" : on part de ce qui est affiché à
      // l'écran (replié en dessous de 940px de large) pour que le bouton
      // fasse l'inverse de ce qu'on voit.
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
      {/* 1. Logo, nom de la filiale et rôle, avec le bouton de repli */}
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

      {/* 2. Sélecteur de filiale : affiché seulement si l'utilisateur a accès
          à plusieurs filiales */}
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

      {/* 3. Scanner et étiquettes QR : ces deux boutons ne sont visibles que
          pour les utilisateurs qui ont la permission "equipements.scanner"
          (attribution des permissions aux rôles : voir PermissionSeeder.php). */}
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
          {/* "Étiquettes QR" : génère et imprime les étiquettes QR Code de
              plusieurs équipements et engins à la fois (filtrables par
              origine, filiale, groupe, site, type), contrairement au scan qui
              lit un seul QR Code à la fois. */}
          <button
            type="button"
            onClick={() => setEtiquettesQrOuvert(true)}
            className="nav-item"
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              width: "100%",
              margin: "0 0 6px",
              border: "none",
              background: "none",
            }}
            title="Étiquettes QR"
          >
            <IconQr />
            <span className="nav-label">Étiquettes QR</span>
          </button>
          {etiquettesQrOuvert && (
            <EtiquettesQr onClose={() => setEtiquettesQrOuvert(false)} />
          )}
        </>
      )}

      <nav>
        {/* 4. Liens principaux */}
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

        {/* 5. Section "Administration" : le titre est affiché selon les mêmes
            permissions que les liens qu'il introduit ci-dessous, pour ne
            jamais apparaître seul, sans rien en dessous. */}
        {(user?.hasPermission("utilisateurs.manage") ||
          user?.hasPermission("equipements.create")) && (
          <div className="nav-section-label">Administration</div>
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
            ses permissions par module, ajouter de nouvelles permissions).
            Réservée aux mêmes comptes que la page Utilisateurs. */}
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
        {/* "Données de base" (Groupes, Types d'équipement) : visible par qui
            crée ou modifie des équipements (equipements.create), et pas
            seulement par qui gère les comptes utilisateurs
            (utilisateurs.manage). Sinon un utilisateur qui n'a que
            equipements.create ne verrait jamais cette section. */}
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

      {/* 6. Utilisateur connecté et déconnexion */}
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
