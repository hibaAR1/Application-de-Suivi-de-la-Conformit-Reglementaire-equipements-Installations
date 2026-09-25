import { useEffect, useState } from "react";
import Plate from "../../components/Plate";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import RoleModal from "./RoleModal";
import NouvellePermissionModal from "./NouvellePermissionModal";

function moduleDe(code) {
  return code.includes(".") ? code.split(".")[0] : "Autres";
}

export default function RolesAdmin() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [modalRoleOuverte, setModalRoleOuverte] = useState(false);
  const [roleEdite, setRoleEdite] = useState(null);
  const [modalPermissionOuverte, setModalPermissionOuverte] = useState(false);

  function charger() {
    setChargement(true);
    Promise.all([apiFetch("/roles"), apiFetch("/permissions")])
      .then(([r, p]) => {
        setRoles(r);
        setPermissions(p);
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
  }, []);

  if (!user?.hasPermission("utilisateurs.manage")) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>
          Accès refusé — cette page est réservée aux administrateurs.
        </Plate>
      </div>
    );
  }

  async function supprimerRole(role) {
    if (!window.confirm(`Supprimer le rôle "${role.libelle}" ?`)) return;
    setErreur("");
    try {
      await apiFetch(`/roles/${role.id_role}`, { method: "DELETE" });
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  }

  const permissionsParModule = permissions.reduce((acc, p) => {
    const m = moduleDe(p.code);
    (acc[m] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 style={{ fontSize: "22px" }}>Rôles & Permissions</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setRoleEdite(null);
            setModalRoleOuverte(true);
          }}
        >
          + Nouveau rôle
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

        {chargement ? (
          <Plate style={{ padding: 24, textAlign: "center" }}>
            Chargement...
          </Plate>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {roles.map((r) => (
                <Plate key={r.id_role} style={{ padding: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <h2 style={{ fontSize: 15 }}>{r.libelle}</h2>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        title="Modifier"
                        style={{ padding: "4px 8px" }}
                        onClick={() => {
                          setRoleEdite(r);
                          setModalRoleOuverte(true);
                        }}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        title="Supprimer"
                        style={{ padding: "4px 8px", color: "var(--danger)" }}
                        onClick={() => supprimerRole(r)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  {r.description && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      {r.description}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {(r.permissions ?? []).length} permission(s) accordée(s)
                  </div>
                </Plate>
              ))}
              {roles.length === 0 && (
                <Plate
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  Aucun rôle.
                </Plate>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h2 style={{ fontSize: 16 }}>Permissions disponibles</h2>
              <button
                className="btn btn-secondary"
                onClick={() => setModalPermissionOuverte(true)}
              >
                + Nouvelle permission
              </button>
            </div>

            <Plate style={{ padding: 18 }}>
              {Object.entries(permissionsParModule).map(([module, liste]) => (
                <div key={module} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      textTransform: "capitalize",
                      marginBottom: 6,
                    }}
                  >
                    {module}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {liste.map((p) => (
                      <span
                        key={p.id_permission}
                        style={{
                          fontSize: 12,
                          padding: "3px 9px",
                          borderRadius: 20,
                          border: "1px solid var(--border)",
                          background: "var(--surface-muted, #f4f2ee)",
                        }}
                        title={p.code}
                      >
                        {p.libelle}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {permissions.length === 0 && (
                <div style={{ color: "var(--text-muted)" }}>
                  Aucune permission.
                </div>
              )}
            </Plate>
          </>
        )}
      </div>

      {modalRoleOuverte && (
        <RoleModal
          roleExistant={roleEdite}
          permissionsToutes={permissions}
          onClose={() => setModalRoleOuverte(false)}
          onEnregistre={charger}
        />
      )}

      {modalPermissionOuverte && (
        <NouvellePermissionModal
          onClose={() => setModalPermissionOuverte(false)}
          onEnregistre={charger}
        />
      )}
    </>
  );
}
