import { useState } from "react";
import { apiFetch } from "../../utils/api";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,13,11,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 20,
};

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  width: "100%",
  maxWidth: 560,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "var(--shadow)",
  padding: 24,
};

function moduleDe(code) {
  return code.includes(".") ? code.split(".")[0] : "Autres";
}

export default function RoleModal({
  roleExistant,
  permissionsToutes,
  onClose,
  onEnregistre,
}) {
  const modeEdition = Boolean(roleExistant);
  const [libelle, setLibelle] = useState(roleExistant?.libelle ?? "");
  const [description, setDescription] = useState(
    roleExistant?.description ?? "",
  );
  const [idPermissions, setIdPermissions] = useState(
    (roleExistant?.permissions ?? []).map((p) => p.id_permission),
  );
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const parModule = permissionsToutes.reduce((acc, p) => {
    const m = moduleDe(p.code);
    (acc[m] ??= []).push(p);
    return acc;
  }, {});

  function basculerPermission(id) {
    setIdPermissions((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  async function enregistrer(e) {
    e.preventDefault();
    if (!libelle.trim()) {
      setErreur("Le nom du rôle est obligatoire.");
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const payload = {
        libelle: libelle.trim(),
        description: description.trim() || null,
        id_permissions: idPermissions,
      };
      const role = modeEdition
        ? await apiFetch(`/roles/${roleExistant.id_role}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/roles", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onEnregistre?.(role);
      onClose();
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 17 }}>
            {modeEdition ? "Modifier le rôle" : "Nouveau rôle"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "4px 10px" }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={enregistrer}>
          <div className="field">
            <label>Nom du rôle</label>
            <input
              type="text"
              placeholder="ex: Auditeur Externe"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Description</label>
            <input
              type="text"
              placeholder="ex: Accès en lecture seule pour un audit externe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 4, marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Permissions accordées à ce rôle
            </label>
            {Object.entries(parModule).map(([module, permissions]) => (
              <div key={module} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    marginBottom: 4,
                  }}
                >
                  {module}
                </div>
                {permissions.map((p) => (
                  <label
                    key={p.id_permission}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      padding: "3px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={idPermissions.includes(p.id_permission)}
                      onChange={() => basculerPermission(p.id_permission)}
                    />
                    {p.libelle}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      ({p.code})
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          {erreur && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: 12.5,
                marginBottom: 10,
              }}
            >
              {erreur}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={envoi}>
              {envoi
                ? "Enregistrement…"
                : modeEdition
                  ? "Enregistrer"
                  : "Créer le rôle"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
