import { useMemo, useState } from "react";
import { useEquipements } from "../../context/EquipementsContext";

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

export default function NouveauTypeModal({ onClose, onCree, typeExistant }) {
  const { creerTypeEquipement, modifierTypeEquipement, typesEquipement } =
    useEquipements();
  const modeEdition = Boolean(typeExistant);
  const [libelle, setLibelle] = useState(typeExistant?.libelle ?? "");
  const [libelleLibre, setLibelleLibre] = useState(false);
  const [categorie, setCategorie] = useState(typeExistant?.categorie ?? "");
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

  const catalogueNomsTypes = useMemo(() => {
    const set = new Set();
    for (const t of typesEquipement) {
      if (t.libelle) set.add(t.libelle);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [typesEquipement]);

  // Vrai seulement en création (pas en modification) quand le nom choisi
  // dans la liste correspond à un type déjà existant : dans ce cas le
  // Groupe est hérité de ce type et grisé.
  const typeExistantSelectionne =
    !modeEdition && !libelleLibre && catalogueNomsTypes.includes(libelle);

  function basculerLibelleLibre() {
    setLibelleLibre((libreActuel) => {
      const nouveau = !libreActuel;
      if (nouveau) {
        setLibelle("");
        setCategorie("");
      } else if (!catalogueNomsTypes.includes(libelle)) {
        setLibelle("");
        setCategorie("");
      }
      return nouveau;
    });
  }

  // Choix d'un nom dans la liste déroulante : si ce nom correspond à un
  // type déjà existant, on reprend automatiquement son Groupe.
  function choisirLibelleExistant(nom) {
    setLibelle(nom);
    if (!modeEdition) {
      const typeCorrespondant = typesEquipement.find((t) => t.libelle === nom);
      setCategorie(typeCorrespondant?.categorie ?? "");
    }
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
    if (!categorie) {
      setErreur("Le groupe (Fixe ou Mobile) est obligatoire.");
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
            <div style={{ display: "flex", gap: 8 }}>
              {libelleLibre ? (
                <input
                  type="text"
                  placeholder="ex: Groupe électrogène"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  style={{ flex: 1 }}
                />
              ) : (
                <select
                  value={catalogueNomsTypes.includes(libelle) ? libelle : ""}
                  onChange={(e) => choisirLibelleExistant(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="" disabled>
                    — Choisir un nom de type —
                  </option>
                  {catalogueNomsTypes.map((nom) => (
                    <option key={nom} value={nom}>
                      {nom}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "6px 12px", flexShrink: 0 }}
                onClick={basculerLibelleLibre}
                title={
                  libelleLibre
                    ? "Choisir dans la liste existante"
                    : "Ajouter un nouveau nom"
                }
              >
                {libelleLibre ? "☰" : "+"}
              </button>
            </div>
            {libelleLibre && (
              <button
                type="button"
                onClick={basculerLibelleLibre}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--bordeaux)",
                  fontSize: 11.5,
                  cursor: "pointer",
                  padding: "2px 0",
                  marginTop: 2,
                }}
              >
                ↩ choisir dans la liste existante
              </button>
            )}
          </div>

          <div className="field">
            <label>Groupe</label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              disabled={typeExistantSelectionne}
              style={
                typeExistantSelectionne
                  ? {
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }
                  : undefined
              }
            >
              <option value="" disabled>
                — Choisir —
              </option>
              <option value="Fixe">Fixe</option>
              <option value="Mobile">Mobile</option>
            </select>
            {typeExistantSelectionne && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                Groupe déjà défini pour ce type existant.
              </div>
            )}
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
