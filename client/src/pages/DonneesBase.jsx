import { useNavigate } from "react-router-dom";
import Plate from "../components/Plate";
import { useAuth } from "../context/AuthContext";
import { useEquipements } from "../context/EquipementsContext";

// Page d'accueil "Administration > Données de base" : deux entrées
// (Groupes, Types d'équipement), chacune vers sa propre page de gestion
// (liste + création + modification + suppression) — même esprit que les
// pages de référence d'un back-office classique, avec le style de notre app.
export default function DonneesBase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groupesEquipement, typesEquipement } = useEquipements();

  if (!user?.hasPermission("utilisateurs.manage")) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>
          Accès refusé — cette page est réservée aux administrateurs.
        </Plate>
      </div>
    );
  }

  const entrees = [
    {
      titre: "Groupes",
      description: "Fixe, Mobile, et les groupes personnalisés.",
      nombre: groupesEquipement.length,
      route: "/donnees-base/groupes",
    },
    {
      titre: "Types d'équipement",
      description: "Types, périodicités et caractéristiques associées.",
      nombre: typesEquipement.length,
      route: "/donnees-base/types",
    },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 style={{ fontSize: "22px" }}>Données de base</h1>
        </div>
      </div>

      <div className="content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {entrees.map((entree) => (
            <Plate
              key={entree.route}
              style={{
                padding: 20,
                cursor: "pointer",
              }}
              onClick={() => navigate(entree.route)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                {entree.nombre} élément(s)
              </div>
              <h2 style={{ fontSize: 17, marginBottom: 6 }}>{entree.titre}</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {entree.description}
              </p>
            </Plate>
          ))}
        </div>
      </div>
    </>
  );
}
