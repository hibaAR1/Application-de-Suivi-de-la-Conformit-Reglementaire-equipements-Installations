import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconQr } from "./icons";

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
  maxWidth: 440,
  boxShadow: "var(--shadow)",
  padding: 24,
};

// Popup "Scanner un équipement", ouverte depuis le bouton "Scanner QR Code"
// de la sidebar (sous le sélecteur de filiale). La caméra terrain n'est pas
// encore branchée ici (le scan caméra existe déjà en plein écran sur
// /scanner, pensé pour le terrain) : cette popup sert surtout à la saisie
// manuelle rapide depuis le poste de travail, avec l'identifiant au format
// [FILIALE]-[SITE]-[TYPE]-[SEQ] (ex. CTM-105-CHAR-01) — voir
// EquipementController::store() côté serveur pour la génération.
export default function ScannerEquipementModal({ onClose }) {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState("");
  const [erreur, setErreur] = useState("");

  function accéder(e) {
    e.preventDefault();
    const ref = identifiant.trim().toUpperCase();
    if (!ref) {
      setErreur("Merci de saisir un identifiant.");
      return;
    }
    onClose();
    navigate(`/scan/${ref}`);
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
          <h2 style={{ fontSize: 17 }}>Scanner un équipement</h2>
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

        <div
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 10,
            padding: "28px 16px",
            textAlign: "center",
            color: "var(--text-muted)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <IconQr />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Caméra terrain</div>
          <div style={{ fontSize: 12 }}>Bientôt disponible</div>
        </div>

        <form onSubmit={accéder}>
          <div className="field">
            <label>Saisir manuellement l'identifiant de l'équipement</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="ex: CTM-105-CHAR-01"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                style={{ flex: 1 }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Accéder
              </button>
            </div>
          </div>

          {erreur && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: 12.5,
                marginTop: -6,
                marginBottom: 10,
              }}
            >
              {erreur}
            </div>
          )}

          <div
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: 6,
            }}
          >
            💡 Format : <strong>[FILIALE]-[SITE]-[TYPE]-[SEQ]</strong>
            <br />
            Ex : CTM-105-CHAR-01 / MP-MP01-GRUE-01 / MT-MT01-CAMB-01
          </div>
        </form>
      </div>
    </div>
  );
}
