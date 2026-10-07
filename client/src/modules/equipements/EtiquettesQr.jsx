import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { useEquipements } from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";

// Lien fixe affiché sur chaque étiquette (portail interne) — pas une donnée
// par équipement/site, donc une simple constante texte ici.
const LIEN_PORTAIL = "smi.menara-holding.ma";

// Couleur dorée FIXE des étiquettes (bordure + référence), volontairement
// indépendante de la variable --gold (qui depuis les couleurs par filiale
// reflète la couleur de la filiale active dans le sidebar, ex: orange pour
// Ménara Logistique). Les étiquettes, elles, doivent toujours garder le même
// doré/ambré, quelle que soit la filiale sélectionnée à l'écran au moment
// de l'impression.
const DORE_ETIQUETTE = "#A6812E";

// Popup "Étiquettes QR" (sidebar, bouton sous "Scanner QR Code") : génère les
// étiquettes QR Code de plusieurs équipements ET engins à la fois, filtrables
// par origine (équipements / engins) / filiale / groupe / site / type, avec
// impression en un clic. Le QR d'un engin est préfixé par "ENGIN:" (voir
// FicheTechniqueEnginModal.jsx) pour que le scanner sache de quelle table il
// s'agit ; l'étiquette d'un engin porte aussi un badge "ENGIN".
// Contrairement au scan (qui LIT un QR Code un par un), cette popup sert à
// IMPRIMER des étiquettes à coller sur le matériel.

// À l'impression, on ne garde QUE les étiquettes : le titre, les filtres, le
// compteur et les boutons ("etiquettes-qr-no-print") sont masqués, ainsi que
// tout le reste de la page (menu, tableau de bord...). Pour que ça marche, la
// popup est rendue directement dans <body> (createPortal) : on peut alors
// cacher tous les autres enfants de <body> sans cacher la popup.
const STYLE_IMPRESSION = `
@media print {
  body > *:not(.etiquettes-qr-overlay) { display: none !important; }
  .etiquettes-qr-overlay {
    position: static !important;
    display: block !important;
    background: none !important;
    padding: 0 !important;
  }
  .etiquettes-qr-print-zone {
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .etiquettes-qr-no-print { display: none !important; }
}
`;

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
  const { equipements, typesEquipement, groupesEquipement } = useEquipements();
  const { engins } = useEngins();
  const { filiales } = useFilialeTheme();

  const [origineFiltre, setOrigineFiltre] = useState("");
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [groupeFiltre, setGroupeFiltre] = useState("");
  const [siteFiltre, setSiteFiltre] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");

  // Équipements et engins dans une seule liste ("origine" = table d'origine).
  const tous = useMemo(
    () => [
      ...equipements.map((eq) => ({
        origine: "equipement",
        id: eq.id_equipement,
        eq,
      })),
      ...engins.map((eq) => ({ origine: "engin", id: eq.id_engin, eq })),
    ],
    [equipements, engins],
  );

  // Tous les groupes (pas seulement Fixe/Mobile) : ceux des types existants et
  // ceux de la table groupe_equipement (Données de base > Groupes).
  const groupesDisponibles = useMemo(() => {
    const set = new Set(["Fixe", "Mobile"]);
    typesEquipement.forEach((t) => t.categorie && set.add(t.categorie));
    groupesEquipement.forEach((g) => set.add(g.libelle));
    return Array.from(set);
  }, [typesEquipement, groupesEquipement]);

  // Sites proposés dans le filtre : seulement ceux réellement utilisés par
  // des équipements/engins de la filiale choisie (sinon tous, si aucune
  // filiale n'est sélectionnée).
  const sitesDisponibles = useMemo(() => {
    const set = new Map();
    tous.forEach(({ origine, eq }) => {
      if (origineFiltre && origine !== origineFiltre) return;
      if (filialeFiltre && eq.filiale?.code !== filialeFiltre) return;
      if (eq.site?.id_site) set.set(eq.site.id_site, eq.site.libelle);
    });
    return [...set.entries()];
  }, [tous, origineFiltre, filialeFiltre]);

  const elementsFiltres = useMemo(() => {
    return tous.filter(({ origine, eq }) => {
      if (origineFiltre && origine !== origineFiltre) return false;
      if (filialeFiltre && eq.filiale?.code !== filialeFiltre) return false;
      if (groupeFiltre && eq.type_equipement?.categorie !== groupeFiltre)
        return false;
      if (siteFiltre && String(eq.site?.id_site) !== String(siteFiltre))
        return false;
      if (typeFiltre && String(eq.id_type_equipement) !== String(typeFiltre))
        return false;
      return true;
    });
  }, [
    tous,
    origineFiltre,
    filialeFiltre,
    groupeFiltre,
    siteFiltre,
    typeFiltre,
  ]);

  const filialeLibelle =
    filiales.find((f) => f.code === filialeFiltre)?.libelle ??
    "Toutes filiales";

  return createPortal(
    <div
      className="etiquettes-qr-overlay"
      style={overlayStyle}
      onClick={onClose}
    >
      <style>{STYLE_IMPRESSION}</style>
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
            value={origineFiltre}
            onChange={(e) => {
              setOrigineFiltre(e.target.value);
              setSiteFiltre("");
            }}
            style={selectStyle}
          >
            <option value="">Équipements & Engins</option>
            <option value="equipement">Équipements</option>
            <option value="engin">Engins</option>
          </select>

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
            <option value="">Tous les groupes</option>
            {groupesDisponibles.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
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
            {elementsFiltres.length} étiquette(s)
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            disabled={elementsFiltres.length === 0}
          >
            🖨 Imprimer
          </button>
        </div>

        {elementsFiltres.length === 0 ? (
          <div style={{ padding: 16, color: "var(--text-muted)" }}>
            Aucun équipement ni engin ne correspond à ces critères.
          </div>
        ) : (
          <div className="etiquettes-qr-grille">
            {elementsFiltres.map(({ origine, id, eq }) => {
              const estEngin = origine === "engin";
              const estMobile = eq.type_equipement?.categorie === "Mobile";
              // Première caractéristique définie pour ce type (ex: "1000 KVA"),
              // affichée sous le type quand elle est renseignée.
              const premiereCle =
                eq.type_equipement?.caracteristiques_definition?.[0]?.cle;
              const valeurCaracteristique = premiereCle
                ? eq.caracteristiques?.[premiereCle]
                : null;

              return (
                <div
                  key={`${origine}-${id}`}
                  style={{
                    border: `1px solid ${DORE_ETIQUETTE}`,
                    borderRadius: 8,
                    padding: 12,
                    background: "var(--surface)",
                    breakInside: "avoid",
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
                        background:
                          estEngin || estMobile
                            ? "#EDE7F6"
                            : "var(--success-bg)",
                        color:
                          estEngin || estMobile ? "#6B4FA0" : "var(--success)",
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
                      {estEngin ? "ENGIN" : estMobile ? "MOBILE" : "FIXE"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      margin: "8px 0",
                    }}
                  >
                    <QRCodeSVG
                      value={estEngin ? `ENGIN:${id}` : id}
                      size={64}
                    />
                  </div>

                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: DORE_ETIQUETTE,
                      fontWeight: 700,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {id}
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
    </div>,
    document.body,
  );
}
