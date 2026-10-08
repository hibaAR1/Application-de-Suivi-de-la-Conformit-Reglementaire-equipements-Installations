import { useState, useEffect } from "react";
import Plate from "../../components/Plate";
import NouveauTypeModal from "./NouveauTypeModal";
import { useAuth } from "../../context/AuthContext";
import { useEquipements } from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";

// Style de la fenêtre de confirmation (même style que les autres popups).
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

export default function TypesEquipementAdmin() {
  const { user } = useAuth();
  const { typesEquipement, equipements, supprimerTypeEquipement } =
    useEquipements();
  const [modalOuverte, setModalOuverte] = useState(false);
  const [typeEdite, setTypeEdite] = useState(null);
  const { engins } = useEngins();
  // Message (toast) affiché en bas à droite de l'écran, puis masqué
  // automatiquement après quelques secondes. Sa couleur dépend du type :
  // "success" (vert), "warning" (jaune) ou "danger" (rouge).
  const [toast, setToast] = useState(null);
  // Suppression en attente de confirmation : { type, nbEq, nbEn } ou null.
  const [aConfirmer, setAConfirmer] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const minuteur = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(minuteur);
  }, [toast]);

  const peutVoir = user?.hasPermission("donnees_base.view");
  const peutCreer = user?.hasPermission("donnees_base.create");
  const peutModifier = user?.hasPermission("donnees_base.edit");
  const peutSupprimer = user?.hasPermission("donnees_base.delete");

  if (!peutVoir) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>
          Accès refusé — cette page est réservée aux administrateurs.
        </Plate>
      </div>
    );
  }

  // Clic sur la corbeille d'un type : on compte les équipements et les engins
  // qui l'utilisent, puis on ouvre la fenêtre de confirmation.
  function supprimer(type) {
    const nbEq = equipements.filter(
      (e) => e.id_type_equipement === type.id_type_equipement,
    ).length;
    const nbEn = engins.filter(
      (e) => e.id_type_equipement === type.id_type_equipement,
    ).length;
    setAConfirmer({ type, nbEq, nbEn });
  }

  // Réponse "oui" dans la fenêtre de confirmation.
  // - Type encore utilisé : la suppression n'est pas lancée, un toast jaune
  //   explique qu'une suppression définitive relève de la direction.
  // - Type inutilisé : il est supprimé (toast vert), ou toast rouge si le
  //   serveur refuse (filet de sécurité).
  async function confirmerSuppression() {
    const { type, nbEq, nbEn } = aConfirmer;
    setAConfirmer(null);
    if (nbEq + nbEn > 0) {
      setToast({
        type: "warning",
        texte: `Le type "${type.libelle}" est encore utilisé par ${nbEq} équipement(s) et ${nbEn} engin(s) : suppression impossible. Pour le supprimer définitivement, contactez la direction.`,
      });
      return;
    }
    try {
      await supprimerTypeEquipement(type.id_type_equipement);
      setToast({ type: "success", texte: `Type "${type.libelle}" supprimé.` });
    } catch (e) {
      // Refus du serveur parce que le type est utilisé : avertissement (jaune).
      // Toute autre erreur (réseau, serveur...) : toast rouge.
      const refusType = e.message?.includes("contactez la direction");
      setToast({ type: refusType ? "warning" : "danger", texte: e.message });
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Données de base / Types d'équipement</div>
          <h1 style={{ fontSize: "22px" }}>Types d'équipement</h1>
        </div>
        {peutCreer && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setTypeEdite(null);
              setModalOuverte(true);
            }}
          >
            + Nouveau type
          </button>
        )}
      </div>

      <div className="content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {typesEquipement.map((t) => {
            const nbEquipements = equipements.filter(
              (e) => e.id_type_equipement === t.id_type_equipement,
            ).length;
            const nbEngins = engins.filter(
              (e) => e.id_type_equipement === t.id_type_equipement,
            ).length;
            return (
              <Plate key={t.id_type_equipement} style={{ padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <h2 style={{ fontSize: 15 }}>{t.libelle}</h2>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {peutModifier && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        title="Modifier"
                        style={{ padding: "4px 8px" }}
                        onClick={() => {
                          setTypeEdite(t);
                          setModalOuverte(true);
                        }}
                      >
                        ✎
                      </button>
                    )}
                    {peutSupprimer && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        title="Supprimer"
                        style={{ padding: "4px 8px", color: "var(--danger)" }}
                        onClick={() => supprimer(t)}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Périodicité : {t.periodicite_controle} mois · Groupe :{" "}
                  {t.categorie}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {nbEquipements} équipement(s) · {nbEngins} engin(s)
                </div>
              </Plate>
            );
          })}
        </div>
      </div>

      {/* Toast (bas à droite) : se ferme tout seul ou avec le bouton ✕ */}
      {toast && (
        <div
          role="alert"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            maxWidth: 420,
            width: "calc(100vw - 48px)",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: "14px 16px",
            borderRadius: 8,
            background: `var(--${toast.type}-bg)`,
            border: `1px solid var(--${toast.type})`,
            borderLeft: `5px solid var(--${toast.type})`,
            boxShadow: "var(--shadow)",
            fontSize: 13.5,
          }}
        >
          <span style={{ flex: 1 }}>{toast.texte}</span>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setToast(null)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Fenêtre de confirmation de suppression (remplace la boîte du
          navigateur). Pour un type encore utilisé, elle prévient qu'une
          suppression définitive relève de la direction. */}
      {aConfirmer && (
        <div style={overlayStyle} onClick={() => setAConfirmer(null)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>
              Supprimer le type
            </h2>
            {aConfirmer.nbEq + aConfirmer.nbEn > 0 ? (
              <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                Le type "{aConfirmer.type.libelle}" est utilisé par{" "}
                {aConfirmer.nbEq} équipement(s) et {aConfirmer.nbEn} engin(s).
                <br />
                <strong>
                  Pour le supprimer définitivement, contactez la direction.
                </strong>
              </p>
            ) : (
              <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                Supprimer le type "{aConfirmer.type.libelle}" ? Cette action est
                irréversible.
              </p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAConfirmer(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmerSuppression}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOuverte && (
        <NouveauTypeModal
          typeExistant={typeEdite}
          onClose={() => setModalOuverte(false)}
          // Appelé après l'enregistrement (création ou modification) : toast vert.
          onCree={(type) =>
            setToast({
              type: "success",
              texte: typeEdite
                ? `Type "${type.libelle}" modifié.`
                : `Type "${type.libelle}" créé.`,
            })
          }
        />
      )}
    </>
  );
}
