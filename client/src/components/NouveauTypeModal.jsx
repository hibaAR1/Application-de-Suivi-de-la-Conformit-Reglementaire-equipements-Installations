import { useMemo, useState } from "react";
import { useEquipements } from "../context/EquipementsContext";
import {
  ajouterGroupePersonnalise,
  getGroupesPersonnalises,
} from "../utils/groupes";

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

// Popup "+ Nouveau type d'équipement" : nom, Groupe (Fixe/Mobile), périodicité,
// et une liste de "Caractéristiques" (autant que l'utilisatrice en ajoute) qui
// deviendront les champs de l'onglet "Caractéristiques" de la fiche équipement.
export default function NouveauTypeModal({ onClose, onCree }) {
  const { creerTypeEquipement, typesEquipement } = useEquipements();
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("Fixe");
  const [periodicite, setPeriodicite] = useState(12);
  const [caracteristiques, setCaracteristiques] = useState([""]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  // Groupes disponibles dans le menu déroulant : Fixe/Mobile de base, plus tout
  // groupe déjà utilisé par un type existant, plus les groupes créés à vide
  // (popup "+ Nouveau groupe" sur la page liste, gardés dans le navigateur).
  const [nouveauGroupeOuvert, setNouveauGroupeOuvert] = useState(false);
  const [nouveauGroupe, setNouveauGroupe] = useState("");
  // Incrémenté à chaque ajout, pour forcer groupesDisponibles à relire le
  // stockage local (celui-ci n'est pas un état React, donc pas suivi tout seul).
  const [versionGroupes, setVersionGroupes] = useState(0);

  const groupesDisponibles = useMemo(() => {
    const set = new Set(["Fixe", "Mobile"]);
    typesEquipement.forEach((t) => t.categorie && set.add(t.categorie));
    getGroupesPersonnalises().forEach((g) => set.add(g));
    return Array.from(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesEquipement, versionGroupes]);

  function ajouterGroupe() {
    const nom = nouveauGroupe.trim();
    if (!nom) return;
    ajouterGroupePersonnalise(nom);
    setVersionGroupes((v) => v + 1);
    setCategorie(nom);
    setNouveauGroupe("");
    setNouveauGroupeOuvert(false);
  }

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
    setEnvoi(true);
    setErreur("");
    try {
      const type = await creerTypeEquipement({
        libelle: libelle.trim(),
        categorie,
        periodiciteControle: Number(periodicite) || 12,
        caracteristiques: caracteristiques.filter((c) => c.trim() !== ""),
      });
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
          <h2 style={{ fontSize: 17 }}>Nouveau type d'équipement</h2>
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

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="field">
              <label>Groupe</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {groupesDisponibles.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "6px 10px" }}
                  title="Créer un nouveau groupe"
                  onClick={() => setNouveauGroupeOuvert((v) => !v)}
                >
                  +
                </button>
              </div>
              {nouveauGroupeOuvert && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="ex: Mixte"
                    value={nouveauGroupe}
                    onChange={(e) => setNouveauGroupe(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: "6px 10px" }}
                    onClick={ajouterGroupe}
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>
            <div className="field">
              <label>Périodicité (mois)</label>
              <input
                type="number"
                min={1}
                value={periodicite}
                onChange={(e) => setPeriodicite(e.target.value)}
              />
            </div>
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
              {envoi ? "Création…" : "Créer le type"}
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
