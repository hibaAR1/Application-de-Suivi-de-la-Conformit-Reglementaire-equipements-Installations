import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export default function Utilisateurs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  function charger() {
    setChargement(true);
    apiFetch("/utilisateurs")
      .then(setUtilisateurs)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
  }, []);

  async function supprimer(id, nom) {
    if (!window.confirm(`Supprimer l'utilisateur "${nom}" ?`)) return;
    try {
      await apiFetch(`/utilisateurs/${id}`, { method: "DELETE" });
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  }

  if (!user?.hasPermission("utilisateurs.manage")) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>
          Accès refusé — cette page est réservée aux administrateurs.
        </Plate>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 style={{ fontSize: "22px" }}>Utilisateurs</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/utilisateurs/nouveau")}
        >
          + Nouvel utilisateur
        </button>
      </div>

      <div className="content">
        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 12 }}
          >
            {erreur}
          </Plate>
        )}

        <Plate>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Filiale</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {chargement ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      Chargement...
                    </td>
                  </tr>
                ) : utilisateurs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Aucun utilisateur.
                    </td>
                  </tr>
                ) : (
                  utilisateurs.map((u) => (
                    <tr key={u.id_utilisateur}>
                      <td style={{ fontWeight: 600 }}>{u.nom}</td>
                      <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td>{u.role?.libelle ?? "—"}</td>
                      <td>
                        {u.filiales && u.filiales.length > 0
                          ? u.filiales.map((f) => f.code).join(", ")
                          : "Toutes filiales"}
                      </td>
                      <td>
                        <Badge tone={u.actif ? "success" : "danger"}>
                          {u.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-secondary"
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            marginRight: 6,
                          }}
                          onClick={() =>
                            navigate(`/utilisateurs/${u.id_utilisateur}`)
                          }
                        >
                          Modifier
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{
                            fontSize: 12,
                            padding: "4px 10px",
                            color: "var(--danger)",
                          }}
                          onClick={() => supprimer(u.id_utilisateur, u.nom)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Plate>
      </div>
    </>
  );
}
