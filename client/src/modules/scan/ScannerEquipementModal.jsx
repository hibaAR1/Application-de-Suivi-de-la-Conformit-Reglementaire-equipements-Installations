/*
 * ============================================================================
 * FENÊTRE : Scanner un équipement ou un engin
 * ============================================================================
 *
 * RÔLE
 *   Fenêtre ouverte par le bouton "Scanner QR Code" du menu latéral. Elle
 *   identifie un équipement ou un engin de deux façons :
 *   1. en scannant son QR Code avec la caméra (librairie html5-qrcode, la
 *      même que le scanner plein écran ScanSimule.jsx) ;
 *   2. en tapant son identifiant à la main, si la caméra est indisponible ou
 *      mal cadrée. Format : [FILIALE]-[SITE]-[TYPE]-[SEQ]
 *      (ex. CTM-105-CHAR-01, généré par EquipementController::store()).
 *
 * RÉSULTAT
 *   Une fois l'identifiant validé (scanné ou tapé), la fenêtre est remplacée
 *   par la Fiche Technique de l'élément trouvé : FicheTechniqueModal pour un
 *   équipement, FicheTechniqueEnginModal pour un engin. Ce n'est pas le
 *   formulaire de contrôle terrain (/scan/:id), qui sert au vrai flux de
 *   contrôle.
 *
 * FORMATS DE TEXTE LUS (voir analyserTexte et extraireIdentifiant)
 *   - Équipement : le QR de la Fiche Technique encode une URL complète
 *     (`${origin}/scan/{id}`) ; on garde alors seulement le dernier segment
 *     du chemin. Un identifiant tapé à la main est déjà "nu".
 *   - Engin : le QR est préfixé par "ENGIN:" (ex. "ENGIN:MP-MP01-GRUE-01").
 *     Un engin et un équipement peuvent avoir exactement le même
 *     identifiant : le préfixe indique dans quelle table chercher.
 *   - Identifiant tapé sans préfixe : recherche d'abord parmi les
 *     équipements, puis parmi les engins. Taper "ENGIN:..." force la
 *     recherche dans les engins.
 * ============================================================================
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEquipements } from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";
import FicheTechniqueModal from "../equipements/FicheTechniqueModal";
import FicheTechniqueEnginModal from "../engins/FicheTechniqueEnginModal";

// Identifiant du conteneur HTML dans lequel la caméra est affichée.
const CONTENEUR_ID = "lecteur-qr-sidebar";

// --- Styles de la fenêtre (fond assombri + carte centrée) ---
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

// ------------------------------------------------------------------
// ANALYSE du texte scanné ou tapé
// ------------------------------------------------------------------
// Renvoie le type cherché ("engin" si le texte commence par "ENGIN:", sinon
// "auto" : à déterminer) et l'identifiant en majuscules.
function analyserTexte(texteBrut) {
  const texte = texteBrut.trim();
  if (texte.toUpperCase().startsWith("ENGIN:")) {
    return { type: "engin", ref: texte.slice(6).trim().toUpperCase() };
  }
  return { type: "auto", ref: extraireIdentifiant(texte) };
}

// Si le texte est une URL (QR d'un équipement), garde le dernier segment du
// chemin ; sinon le texte est déjà l'identifiant.
function extraireIdentifiant(texteBrut) {
  const texte = texteBrut.trim();
  try {
    const url = new URL(texte);
    const segments = url.pathname.split("/").filter(Boolean);
    return (segments[segments.length - 1] || texte).toUpperCase();
  } catch {
    return texte.toUpperCase();
  }
}

// ------------------------------------------------------------------
// COMPOSANT
// ------------------------------------------------------------------
export default function ScannerEquipementModal({ onClose }) {
  const { getByRef } = useEquipements();
  const { getEnginByRef } = useEngins();
  const [identifiant, setIdentifiant] = useState("");
  const [erreur, setErreur] = useState("");
  // { type: "equipement" | "engin", ref } une fois l'identifiant validé.
  const [trouve, setTrouve] = useState(null);
  const [etatCamera, setEtatCamera] = useState("attente"); // attente | actif | indisponible
  // Évite de traiter plusieurs fois le même QR : la caméra le détecte à
  // chaque image tant qu'il reste devant elle.
  const dejaTraite = useRef(false);

  // ------------------------------------------------------------------
  // RECHERCHE de l'élément correspondant à l'identifiant
  // ------------------------------------------------------------------
  // Avec le préfixe "ENGIN:", on cherche seulement parmi les engins. Sinon :
  // d'abord les équipements, puis les engins. Aucun résultat : message
  // d'erreur.
  function traiterIdentifiant(refBrute) {
    const { type, ref } = analyserTexte(refBrute);
    if (!ref) {
      setErreur("Merci de saisir un identifiant.");
      return;
    }
    let cible = null;
    if (type === "engin") {
      if (getEnginByRef(ref)) cible = { type: "engin", ref };
    } else if (getByRef(ref)) {
      cible = { type: "equipement", ref };
    } else if (getEnginByRef(ref)) {
      cible = { type: "engin", ref };
    }
    if (!cible) {
      setErreur("Aucun équipement ni engin trouvé avec cet identifiant.");
      return;
    }
    dejaTraite.current = true;
    setErreur("");
    setTrouve(cible);
  }

  // ------------------------------------------------------------------
  // CAMÉRA : démarrage et arrêt du scanner
  // ------------------------------------------------------------------
  // Le scanner ne tourne que tant qu'aucun élément n'a été trouvé : ensuite
  // la Fiche Technique remplace cette fenêtre et la caméra n'est plus utile.
  //
  // Html5QrcodeScanner ajoute ses propres boutons dans le conteneur et son
  // scanner.clear() est asynchrone. Si un second scanner démarre avant que
  // le premier ait fini de se nettoyer, on obtient deux jeux de boutons
  // "Stop Scanning" et une erreur "removeChild". On vide donc le conteneur
  // nous-mêmes avant de créer un scanner, et de nouveau si clear() échoue.
  // (Ce cas se produit en développement avec React StrictMode, qui monte
  // l'effet deux fois de suite ; StrictMode est retiré dans main.jsx.)
  useEffect(() => {
    if (trouve) return undefined;

    let scanner;
    try {
      const conteneur = document.getElementById(CONTENEUR_ID);
      if (conteneur) conteneur.innerHTML = "";

      scanner = new Html5QrcodeScanner(
        CONTENEUR_ID,
        { fps: 10, qrbox: 200 },
        false,
      );
      scanner.render(
        (texteDecode) => {
          if (dejaTraite.current) return;
          traiterIdentifiant(texteDecode);
        },
        () => {
          // Appelé à chaque image sans QR détecté : signe que la caméra tourne bien.
          setEtatCamera((e) => (e === "attente" ? "actif" : e));
        },
      );
    } catch {
      setEtatCamera("indisponible");
    }

    return () => {
      scanner?.clear().catch(() => {
        const conteneur = document.getElementById(CONTENEUR_ID);
        if (conteneur) conteneur.innerHTML = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trouve]);

  // ------------------------------------------------------------------
  // AFFICHAGE
  // ------------------------------------------------------------------
  // Les deux rendus passent par un portail vers document.body : ce composant
  // est monté depuis le menu latéral, qui impose un texte clair (fond
  // sombre : .sidebar { color: #EFE9DF }). Sans portail, la fenêtre (fond
  // clair) hériterait de ce texte clair et deviendrait quasi illisible. Le
  // portail la sort de l'arbre DOM du menu, donc sans style hérité.

  // Élément trouvé : on affiche sa Fiche Technique (équipement ou engin).
  if (trouve) {
    return createPortal(
      trouve.type === "engin" ? (
        <FicheTechniqueEnginModal id={trouve.ref} onClose={onClose} />
      ) : (
        <FicheTechniqueModal id={trouve.ref} onClose={onClose} />
      ),
      document.body,
    );
  }

  // Validation du formulaire de saisie manuelle.
  function accéder(e) {
    e.preventDefault();
    traiterIdentifiant(identifiant);
  }

  // Sinon : la fenêtre de scan. Un clic sur le fond assombri la ferme ; un
  // clic dans la carte ne la ferme pas.
  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Titre et bouton de fermeture */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 17 }}>Scanner un équipement ou un engin</h2>
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

        {/* Zone caméra : pastille d'état (initialisation / actif / indisponible)
            puis flux vidéo du scanner */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 12px 16px",
            marginBottom: 18,
            background: "#0C0B0A",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "'IBM Plex Mono',monospace",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 10,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${
                etatCamera === "actif"
                  ? "#D4AF37"
                  : etatCamera === "indisponible"
                    ? "#C0392B"
                    : "rgba(239,233,223,0.3)"
              }`,
              color:
                etatCamera === "actif"
                  ? "#D4AF37"
                  : etatCamera === "indisponible"
                    ? "#E57373"
                    : "#EFE9DF",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "currentColor",
              }}
            />
            {etatCamera === "attente" && "Initialisation de la caméra…"}
            {etatCamera === "actif" && "Scan actif — vise le QR code"}
            {etatCamera === "indisponible" &&
              "Caméra indisponible — saisis l'identifiant ci-dessous"}
          </div>
          <div id={CONTENEUR_ID} style={{ maxWidth: 360, margin: "0 auto" }} />
        </div>

        {/* Saisie manuelle de l'identifiant (repli si la caméra ne marche pas) */}
        <form onSubmit={accéder}>
          <div className="field">
            <label>
              Ou saisir manuellement l'identifiant (équipement ou engin)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="ex: CTM-105-CHAR-01"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                Accéder
              </button>
            </div>
          </div>

          {/* Message d'erreur : identifiant vide ou introuvable */}
          {erreur && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: 12.5,
                marginTop: -6,
                marginBottom: 10,
              }}
            >
              {erreur}
            </div>
          )}

          {/* Aide : format attendu des identifiants */}
          <div
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: 6,
            }}
          >
            💡 Format : <strong>[FILIALE]-[SITE]-[TYPE]-[SEQ]</strong>
            <br />
            Ex : CTM-105-CHAR-01 / MP-MP01-GRUE-01 / MT-MT01-CAMB-01
            <br />
            Engin : le QR contient ENGIN:[identifiant] — tu peux aussi le taper
            pour forcer la recherche dans les engins.
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
