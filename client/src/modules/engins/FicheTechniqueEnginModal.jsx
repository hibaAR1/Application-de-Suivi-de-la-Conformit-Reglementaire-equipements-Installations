import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Badge from "../../components/Badge";
import { useEngins } from "../../context/EnginsContext";

// Fiche technique / étiquette imprimable d'un ENGIN, ouverte depuis le bouton
// "Étiquette QR" de la liste des engins. Distincte de EnginModal (bouton
// "Ouvrir") : pas d'onglets, juste un résumé pensé pour être scanné/imprimé.

function dernierControle(eq) {
  if (!eq.controles?.length) return null;
  return [...eq.controles].sort(
    (a, b) => new Date(b.date_controle) - new Date(a.date_controle),
  )[0];
}

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

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
};

function Champ({ label, valeur }) {
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div className="spec-label">{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>
        {valeur ?? "—"}
      </div>
    </div>
  );
}

export default function FicheTechniqueEnginModal({ id, onClose }) {
  const { getEnginByRef } = useEngins();
  const eq = getEnginByRef(id);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!eq) return null;

  const dernier = dernierControle(eq);
  const definition = eq.type_equipement?.caracteristiques_definition ?? [];
  const valeurs = eq.caracteristiques ?? {};
  // Le QR d'un engin est préfixé par "ENGIN:" : les identifiants d'engins ont
  // le même format que ceux des équipements (ex. "MP-CAS-GRUE-01"), donc sans
  // ce préfixe le scanner ne pourrait pas savoir de quelle table il s'agit.
  const valeurQr = `ENGIN:${eq.id_engin}`;
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "20px 24px 0",
          }}
        >
          <h2 style={{ fontSize: 18 }}>
            Fiche Technique Engin — {eq.id_engin}
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

        <div style={{ padding: "12px 24px 24px" }}>
          {/* Bandeau résumé + QR : ce qu'on voit d'abord en scannant l'étiquette */}
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Scan pour rapport
                </span>
                <Badge tone="warning">ENGIN</Badge>
                <Badge
                  tone={
                    eq.type_equipement?.categorie === "Mobile"
                      ? "warning"
                      : "success"
                  }
                >
                  {(eq.type_equipement?.categorie ?? "—").toUpperCase()}
                </Badge>
                <Badge
                  tone={eq.statut === "Non conforme" ? "danger" : "success"}
                >
                  {eq.statut === "Non conforme" ? "Inactif" : "Actif"}
                </Badge>
              </div>
              <div style={{ fontSize: 19, fontWeight: 800 }}>{eq.id_engin}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {eq.designation}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {eq.filiale?.libelle ?? "—"}
                {eq.site?.libelle ? ` — ${eq.site.libelle}` : ""}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                Type : {eq.type_equipement?.libelle ?? "—"} &nbsp;|&nbsp;
                Périodicité :{" "}
                {eq.type_equipement?.periodicite_controle
                  ? `${eq.type_equipement.periodicite_controle} mois`
                  : "—"}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 6,
                  padding: 6,
                }}
              >
                <QRCodeSVG
                  value={valeurQr}
                  size={76}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <div
                className="mono"
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#6B4FA0",
                }}
              >
                ENGIN
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 16,
            }}
          >
            <Champ label="Fabricant" valeur={eq.fabricant} />
            <Champ label="Modèle" valeur={eq.modele} />
            <Champ label="Année fab." valeur={eq.annee_fabrication} />
            <Champ label="N° série" valeur={eq.numero_serie} />
            <Champ label="Site" valeur={eq.site?.libelle} />
            <Champ
              label="Dernier contrôle"
              valeur={
                dernier ? formaterDate(dernier.date_controle) : "Non effectué"
              }
            />
            <Champ
              label="Prochain contrôle"
              valeur={
                dernier?.prochaine_echeance
                  ? formaterDate(dernier.prochaine_echeance)
                  : "Non renseigné"
              }
            />
            <Champ label="Organisme" valeur={eq.organisme_controle} />
          </div>

          {definition.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Caractéristiques techniques
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {definition.map((c) => (
                  <Champ
                    key={c.cle}
                    label={c.libelle}
                    valeur={valeurs[c.cle]}
                  />
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              marginTop: 20,
              paddingTop: 10,
              fontSize: 10.5,
              color: "var(--text-muted)",
            }}
            className="mono"
          >
            <span>Direction SMI — Ménara Holding</span>
            <span>{eq.id_engin}</span>
            <span>Contrôle Réglementaire</span>
          </div>
        </div>
      </div>
    </div>
  );
}
