import { useState } from "react";
import { useEquipements } from "../context/EquipementsContext";

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
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "var(--shadow)",
  padding: 24,
};

// Popup "+ Nouveau type d'équipement" : nom, périodicité, et une liste de
// "Caractéristiques" (autant que l'utilisatrice en ajoute) qui deviendront
// les champs de l'onglet "Caractéristiques" de la fiche équipement.
// Le champ "Groupe" (Fixe/Mobile) a été retiré de cette popup : le type est
// créé avec le groupe "Fixe" par défaut, modifiable ensuite si besoin.
//
// `typeExistant` (optionnel) : passe la popup en mode modification (page
// "Données de base > Types d'équipement") — pré-remplit les champs et
// appelle modifierTypeEquipement() au lieu de creerTypeEquipement().
export default function NouveauTypeModal({ onClose, onCree, typeExistant }) {
  const { creerTypeEquipement, modifierTypeEquipement } = useEquipements();
  const modeEdition = Boolean(typeExistant);
  const [libelle, setLibelle] = useState(typeExistant?.libelle ?? "");
  // Pas de sélecteur ici (retiré exprès) : à la création on fige "Fixe", mais
  // en modification on garde la catégorie déjà enregistrée pour ne pas
  // l'écraser silencieusement.
  const [categorie] = useState(typeExistant?.categorie ?? "Fixe");
  const [periodicite, setPeriodicite] = useState(
    typeExistant?.periodicite_controle
      ? String(typeExistant.periodicite_controle)
      : "",
  );
  const [caracteristiques, setCaracteristiques] = useState(
    typeExistant?.caracteristiques_definition?.length
      ? typeExistant.caracteristiques_definition.map((c) => c.libelle)
      : [""],
  );
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  function modifierCaracteristique(index, valeur) {
    setCaracteristiques((prev) =>
      prev.map((c, i) => (i === index ? valeur : c)),
    );
  }

  function ajouterCaracteristique() {
    setCaracteristiques((prev) => [...prev, ""]);
  }

  function retirerCaracteristique(index) {
    setCaracteristiques((prev) => prev.filter((_, i) => i !== index));
  }

  async function enregistrer(e) {
    e.preventDefault();
    if (!libelle.trim()) {
      setErreur("Le nom du type est obligatoire.");
      return;
    }
    if (!periodicite || Number(periodicite) < 1) {
      setErreur("La périodicité (mois) est obligatoire.");
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const donnees = {
        libelle: libelle.trim(),
        categorie,
        periodiciteControle: Number(periodicite),
        caracteristiques: caracteristiques.filter((c) => c.trim() !== ""),
      };
      const type = modeEdition
        ? await modifierTypeEquipement(typeExistant.id_type_equipement, donnees)
        : await creerTypeEquipement(donnees);
      onCree?.(type);
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
            {modeEdition
              ? "Modifier le type d'équipement"
              : "Nouveau type d'équipement"}
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
            <label>Nom du type</label>
            <input
              type="text"
              placeholder="ex: Groupe électrogène"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              Périodicité (mois){" "}
              <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="ex: 12"
              value={periodicite}
              onChange={(e) => setPeriodicite(e.target.value)}
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
                marginBottom: 6,
              }}
            >
              Caractéristiques (les champs qui apparaîtront dans l'onglet
              "Caractéristiques" de la fiche)
            </label>
            {caracteristiques.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="ex: Puissance, Tension, Norme..."
                  value={c}
                  onChange={(e) => modifierCaracteristique(i, e.target.value)}
                  style={{ flex: 1 }}
                />
                {caracteristiques.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "6px 10px" }}
                    onClick={() => retirerCaracteristique(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={ajouterCaracteristique}
            >
              + Ajouter une caractéristique
            </button>
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
                  : "Créer le type"}
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
