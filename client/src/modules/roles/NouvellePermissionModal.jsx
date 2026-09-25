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
  maxWidth: 460,
  boxShadow: "var(--shadow)",
  padding: 24,
};

export default function NouvellePermissionModal({ onClose, onEnregistre }) {
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer(e) {
    e.preventDefault();
    if (!code.trim() || !libelle.trim()) {
      setErreur("Le code et le libellé sont obligatoires.");
      return;
    }
    if (!code.includes(".")) {
      setErreur(
        "Le code doit être au format « module.action », ex: equipements.export",
      );
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const permission = await apiFetch("/permissions", {
        method: "POST",
        body: JSON.stringify({ code: code.trim(), libelle: libelle.trim() }),
      });
      onEnregistre?.(permission);
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
          <h2 style={{ fontSize: 17 }}>Nouvelle permission</h2>
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
            <label>Code technique</label>
            <input
              type="text"
              placeholder="ex: equipements.export"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>
              Format « module.action » — le module (avant le point) sert à
              regrouper les permissions dans la gestion des rôles.
            </small>
          </div>

          <div className="field">
            <label>Libellé (affiché à l'écran)</label>
            <input
              type="text"
              placeholder="ex: Exporter la liste des équipements"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
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
              {envoi ? "Enregistrement…" : "Créer la permission"}
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
