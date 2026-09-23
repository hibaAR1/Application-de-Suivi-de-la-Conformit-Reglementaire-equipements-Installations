import { useState } from "react";
import { ajouterGroupePersonnalise } from "../utils/groupes";

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
  maxWidth: 420,
  boxShadow: "var(--shadow)",
  padding: 24,
};

// Popup "+ Nouveau groupe" : juste un nom (ex: "Mixte"), en plus de Fixe/Mobile.
// Différente de la popup "+ Nouveau type" — ici on ne crée qu'un groupe, pas un
// type complet avec ses caractéristiques.
export default function NouveauGroupeModal({ onClose, onCree }) {
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState("");

  function enregistrer(e) {
    e.preventDefault();
    const valeur = nom.trim();
    if (!valeur) {
      setErreur("Le nom du groupe est obligatoire.");
      return;
    }
    ajouterGroupePersonnalise(valeur);
    onCree?.(valeur);
    onClose();
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
          <h2 style={{ fontSize: 17 }}>Nouveau groupe</h2>
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
            <label>Nom du groupe</label>
            <input
              type="text"
              placeholder="ex: Mixte"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
            />
          </div>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: -6,
              marginBottom: 14,
            }}
          >
            Ce groupe s'ajoutera à côté de "Fixe" et "Mobile" dans les listes
            déroulantes.
          </p>

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
            <button type="submit" className="btn btn-primary">
              Créer le groupe
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
