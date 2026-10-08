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

// Actions proposées dans la liste : code utilisé dans la permission + nom
// affiché. "autre" permet de saisir une action qui n'est pas dans la liste.
const ACTIONS = [
  { code: "view", nom: "Voir" },
  { code: "create", nom: "Créer" },
  { code: "edit", nom: "Modifier" },
  { code: "delete", nom: "Supprimer" },
];
const NOUVEAU = "__nouveau__";

// Transforme un texte saisi en code propre : minuscules, sans accents ni
// espaces ("Rapports annuels" -> "rapports_annuels").
function versCode(texte) {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Fenêtre "+ Nouvelle permission" : on CHOISIT le module et l'action dans des
// listes, le code "module.action" est fabriqué automatiquement (plus d'erreur
// de format possible). `permissionsExistantes` sert à proposer les modules
// existants et à refuser un doublon.
export default function NouvellePermissionModal({
  onClose,
  onEnregistre,
  permissionsExistantes = [],
}) {
  const modules = [
    ...new Set(
      permissionsExistantes.map((p) => p.code?.split(".")[0]).filter((m) => m),
    ),
  ].sort();

  const [module, setModule] = useState("");
  const [nouveauModule, setNouveauModule] = useState("");
  const [action, setAction] = useState("");
  const [nouvelleAction, setNouvelleAction] = useState("");
  const [libelle, setLibelle] = useState("");
  const [libelleModifie, setLibelleModifie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  // Valeurs réellement utilisées (liste, ou texte saisi pour "nouveau").
  const moduleFinal = module === NOUVEAU ? versCode(nouveauModule) : module;
  const actionFinale = action === NOUVEAU ? versCode(nouvelleAction) : action;
  const code =
    moduleFinal && actionFinale ? `${moduleFinal}.${actionFinale}` : "";

  // Libellé proposé automatiquement tant que l'utilisateur ne l'a pas modifié.
  const nomAction =
    action === NOUVEAU
      ? nouvelleAction.trim()
      : (ACTIONS.find((a) => a.code === action)?.nom ?? "");
  const libelleAffiche = libelleModifie
    ? libelle
    : code
      ? `${nomAction} (${moduleFinal})`
      : "";

  async function enregistrer(e) {
    e.preventDefault();
    if (!code) {
      setErreur("Choisissez un module et une action.");
      return;
    }
    if (!libelleAffiche.trim()) {
      setErreur("Le libellé est obligatoire.");
      return;
    }
    if (permissionsExistantes.some((p) => p.code === code)) {
      setErreur(`La permission « ${code} » existe déjà.`);
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const permission = await apiFetch("/permissions", {
        method: "POST",
        body: JSON.stringify({ code, libelle: libelleAffiche.trim() }),
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
            <label>Module</label>
            <select value={module} onChange={(e) => setModule(e.target.value)}>
              <option value="">— Choisir un module —</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value={NOUVEAU}>+ Nouveau module…</option>
            </select>
            {module === NOUVEAU && (
              <input
                type="text"
                placeholder="ex: rapports"
                value={nouveauModule}
                onChange={(e) => setNouveauModule(e.target.value)}
                style={{ marginTop: 8 }}
                autoFocus
              />
            )}
          </div>

          <div className="field">
            <label>Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">— Choisir une action —</option>
              {ACTIONS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.nom}
                </option>
              ))}
              <option value={NOUVEAU}>Autre…</option>
            </select>
            {action === NOUVEAU && (
              <input
                type="text"
                placeholder="ex: exporter"
                value={nouvelleAction}
                onChange={(e) => setNouvelleAction(e.target.value)}
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          <div className="field">
            <label>Libellé (affiché à l'écran)</label>
            <input
              type="text"
              placeholder="ex: Créer un équipement"
              value={libelleAffiche}
              onChange={(e) => {
                setLibelle(e.target.value);
                setLibelleModifie(true);
              }}
            />
          </div>

          <div style={{ fontSize: 12.5, marginBottom: 10 }}>
            Code créé :{" "}
            <strong style={{ fontFamily: "monospace" }}>{code || "—"}</strong>
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 12,
            }}
          >
            Attention : cette permission n'agit que si elle est utilisée dans le
            programme (un développeur doit la brancher).
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
