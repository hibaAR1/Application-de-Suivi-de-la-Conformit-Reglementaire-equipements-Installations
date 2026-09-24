import { useState } from "react";
import Plate from "../../components/Plate";
import { useAuth } from "../../context/AuthContext";
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
  maxWidth: 420,
  boxShadow: "var(--shadow)",
  padding: 24,
};

// Popup "+ Nouveau groupe" / "Modifier le groupe", en local à cette page —
// juste un libellé, comme dans TypeEquipementModal mais plus simple : pas
// de périodicité ni de caractéristiques pour un groupe.
function GroupeModal({ groupeExistant, onClose, onEnregistre }) {
  const { creerGroupeEquipement, modifierGroupeEquipement } = useEquipements();
  const modeEdition = Boolean(groupeExistant);
  const [libelle, setLibelle] = useState(groupeExistant?.libelle ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer(e) {
    e.preventDefault();
    if (!libelle.trim()) {
      setErreur("Le nom du groupe est obligatoire.");
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const groupe = modeEdition
        ? await modifierGroupeEquipement(
            groupeExistant.id_groupe_equipement,
            libelle.trim(),
          )
        : await creerGroupeEquipement(libelle.trim());
      onEnregistre?.(groupe);
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
            {modeEdition ? "Modifier le groupe" : "Nouveau groupe"}
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
            <label>Nom du groupe</label>
            <input
              type="text"
              placeholder="ex: Mixte"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              autoFocus
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
              {envoi
                ? "Enregistrement…"
                : modeEdition
                  ? "Enregistrer"
                  : "Créer le groupe"}
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

export default function GroupesEquipementAdmin() {
  const { user } = useAuth();
  const { groupesEquipement, typesEquipement, supprimerGroupeEquipement } =
    useEquipements();
  const [modalOuverte, setModalOuverte] = useState(false);
  const [groupeEdite, setGroupeEdite] = useState(null);
  const [erreur, setErreur] = useState("");

  if (!user?.hasPermission("utilisateurs.manage")) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>
          Accès refusé — cette page est réservée aux administrateurs.
        </Plate>
      </div>
    );
  }

  async function supprimer(groupe) {
    if (!window.confirm(`Supprimer le groupe "${groupe.libelle}" ?`)) return;
    setErreur("");
    try {
      await supprimerGroupeEquipement(groupe.id_groupe_equipement);
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Données de base / Groupes</div>
          <h1 style={{ fontSize: "22px" }}>Groupes</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setGroupeEdite(null);
            setModalOuverte(true);
          }}
        >
          + Nouveau groupe
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {groupesEquipement.map((g) => {
            const nbTypes = typesEquipement.filter(
              (t) => t.categorie === g.libelle,
            ).length;
            return (
              <Plate key={g.id_groupe_equipement} style={{ padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <h2 style={{ fontSize: 15 }}>{g.libelle}</h2>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      title="Modifier"
                      style={{ padding: "4px 8px" }}
                      onClick={() => {
                        setGroupeEdite(g);
                        setModalOuverte(true);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      title="Supprimer"
                      style={{ padding: "4px 8px", color: "var(--danger)" }}
                      onClick={() => supprimer(g)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {nbTypes} type(s) d'équipement
                </div>
              </Plate>
            );
          })}
        </div>
      </div>

      {modalOuverte && (
        <GroupeModal
          groupeExistant={groupeEdite}
          onClose={() => setModalOuverte(false)}
        />
      )}
    </>
  );
}
