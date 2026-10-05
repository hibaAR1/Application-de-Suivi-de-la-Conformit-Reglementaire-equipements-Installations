import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useEquipements } from "../../context/EquipementsContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";

// Lien fixe affiché sur chaque étiquette (portail interne) — pas une donnée
// par équipement/site, donc une simple constante texte ici.
const LIEN_PORTAIL = "smi.menara-holding.ma";

// Popup "Étiquettes QR" (sidebar, bouton sous "Scanner QR Code") : génère les
// étiquettes QR Code de plusieurs équipements à la fois, filtrables par
// filiale / groupe (Fixe-Mobile) / site / type, avec impression en un clic.
// Contrairement au scan (qui LIT un QR Code un par un), cette popup sert à
// IMPRIMER des étiquettes à coller sur le matériel.

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
  maxWidth: 1100,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "var(--shadow)",
  padding: 24,
};

// Même style que les <select> du reste de l'app (classe ".field select" dans
// tokens.css), appliqué ici en inline car ces filtres ne sont pas dans un
// ".field" (pas de <label> au-dessus).
const selectStyle = {
  padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: 5,
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 13.5,
  fontFamily: "inherit",
};

export default function EtiquettesQr({ onClose }) {
  const { equipements, typesEquipement } = useEquipements();
  const { filiales } = useFilialeTheme();

  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [groupeFiltre, setGroupeFiltre] = useState("");
  const [siteFiltre, setSiteFiltre] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");

  const sitesDisponibles = useMemo(() => {
    const set = new Map();
    equipements.forEach((eq) => {
      if (filialeFiltre && eq.filiale?.code !== filialeFiltre) return;
      if (eq.site?.id_site) set.set(eq.site.id_site, eq.site.libelle);
    });
    return [...set.entries()];
  }, [equipements, filialeFiltre]);

  const equipementsFiltres = useMemo(() => {
    return equipements.filter((eq) => {
      if (filialeFiltre && eq.filiale?.code !== filialeFiltre) return false;
      if (groupeFiltre && eq.type_equipement?.categorie !== groupeFiltre)
        return false;
      if (siteFiltre && String(eq.site?.id_site) !== String(siteFiltre))
        return false;
      if (typeFiltre && String(eq.id_type_equipement) !== String(typeFiltre))
        return false;
      return true;
    });
  }, [equipements, filialeFiltre, groupeFiltre, siteFiltre, typeFiltre]);

  const filialeLibelle =
    filiales.find((f) => f.code === filialeFiltre)?.libelle ??
    "Toutes filiales";

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        className="etiquettes-qr-print-zone"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="etiquettes-qr-no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 17, color: "var(--bordeaux)" }}>
            Génération des étiquettes QR Code — {filialeLibelle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              fontSize: 18,
              lineHeight: 1,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div
          className="etiquettes-qr-no-print"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <select
            value={filialeFiltre}
            onChange={(e) => {
              setFilialeFiltre(e.target.value);
              setSiteFiltre("");
            }}
            style={selectStyle}
          >
            <option value="">Toutes les filiales</option>
            {filiales.map((f) => (
              <option key={f.code} value={f.code}>
                {f.libelle}
              </option>
            ))}
          </select>

          <select
            value={groupeFiltre}
            onChange={(e) => setGroupeFiltre(e.target.value)}
            style={selectStyle}
          >
            <option value="">Fixes & Mobiles</option>
            <option value="Fixe">Fixes uniquement</option>
            <option value="Mobile">Mobiles uniquement</option>
          </select>

          <select
            value={siteFiltre}
            onChange={(e) => setSiteFiltre(e.target.value)}
            style={selectStyle}
          >
            <option value="">Tous les sites</option>
            {sitesDisponibles.map(([id, libelle]) => (
              <option key={id} value={id}>
                {libelle}
              </option>
            ))}
          </select>

          <select
            value={typeFiltre}
            onChange={(e) => setTypeFiltre(e.target.value)}
            style={selectStyle}
          >
            <option value="">Tous les types</option>
            {typesEquipement.map((t) => (
              <option key={t.id_type_equipement} value={t.id_type_equipement}>
                {t.libelle}
              </option>
            ))}
          </select>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {equipementsFiltres.length} équipement(s)
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            disabled={equipementsFiltres.length === 0}
          >
            🖨 Imprimer
          </button>
        </div>

        {equipementsFiltres.length === 0 ? (
          <div style={{ padding: 16, color: "var(--text-muted)" }}>
            Aucun équipement ne correspond à ces critères.
          </div>
        ) : (
          <div className="etiquettes-qr-grille">
            {equipementsFiltres.map((eq) => {
              const estMobile = eq.type_equipement?.categorie === "Mobile";
              const premiereCle =
                eq.type_equipement?.caracteristiques_definition?.[0]?.cle;
              const valeurCaracteristique = premiereCle
                ? eq.caracteristiques?.[premiereCle]
                : null;

              return (
                <div
                  key={eq.id_equipement}
                  style={{
                    border: "1px solid var(--gold)",
                    borderRadius: 8,
                    padding: 12,
                    background: "var(--surface)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="mono"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    >
                      {eq.filiale?.code ?? "—"}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 9px",
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'IBM Plex Mono', monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        background: estMobile ? "#EDE7F6" : "var(--success-bg)",
                        color: estMobile ? "#6B4FA0" : "var(--success)",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "currentColor",
                        }}
                      />
                      {estMobile ? "MOBILE" : "FIXE"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      margin: "8px 0",
                    }}
                  >
                    <QRCodeSVG value={eq.id_equipement} size={64} />
                  </div>

                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--gold)",
                      fontWeight: 700,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {eq.id_equipement}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {eq.designation}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    {eq.type_equipement?.libelle ?? "—"}
                  </div>
                  {valeurCaracteristique && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        textAlign: "center",
                      }}
                    >
                      {valeurCaracteristique}
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: "1px dashed var(--border)",
                      marginTop: 8,
                      paddingTop: 6,
                      fontSize: 10.5,
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    {eq.site?.libelle ?? eq.filiale?.libelle ?? "—"}
                  </div>
                  <div
                    className="mono"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      marginTop: 3,
                      fontSize: 10,
                      color: "#3D6FA6",
                    }}
                  >
                    <span>🔗</span>
                    <span>{LIEN_PORTAIL}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
