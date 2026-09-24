import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEquipements } from "../../context/EquipementsContext";
import FicheTechniqueModal from "../equipements/FicheTechniqueModal";

const CONTENEUR_ID = "lecteur-qr-sidebar";

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

// Popup "Scanner un équipement", ouverte depuis le bouton "Scanner QR Code"
// de la sidebar (sous le sélecteur de filiale). Utilise la même librairie
// caméra que le scanner plein écran existant (html5-qrcode, voir
// ScanSimule.jsx sur /scanner), embarquée ici dans un cadre plus petit,
// avec en repli la saisie manuelle de l'identifiant si la caméra n'est pas
// disponible ou mal cadrée — au format [FILIALE]-[SITE]-[TYPE]-[SEQ]
// (ex. CTM-105-CHAR-01, voir EquipementController::store() côté serveur).
//
// Une fois l'identifiant validé (scanné ou tapé), on affiche directement la
// Fiche Technique (même composant que le bouton "Étiquette QR" de la liste
// des équipements, même style dans toute l'app) — pas le formulaire de
// contrôle terrain (/scan/:id → MobileControl), réservé au vrai flux de
// contrôle.
// Le QR code généré par la Fiche Technique (voir FicheTechniqueModal.jsx,
// `valeurQr`) encode une URL complète — `${origin}/scan/{id}` — pas juste
// l'identifiant tout seul. Un identifiant tapé à la main, lui, est déjà nu.
// On gère donc les deux cas : si le texte scanné est une URL, on ne garde
// que son dernier segment de chemin.
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

export default function ScannerEquipementModal({ onClose }) {
  const { getByRef } = useEquipements();
  const [identifiant, setIdentifiant] = useState("");
  const [erreur, setErreur] = useState("");
  const [equipementTrouve, setEquipementTrouve] = useState(null);
  const [etatCamera, setEtatCamera] = useState("attente"); // attente | actif | indisponible
  const dejaTraite = useRef(false);

  function traiterIdentifiant(refBrute) {
    const ref = extraireIdentifiant(refBrute);
    if (!ref) {
      setErreur("Merci de saisir un identifiant.");
      return;
    }
    if (!getByRef(ref)) {
      setErreur("Aucun équipement trouvé avec cet identifiant.");
      return;
    }
    dejaTraite.current = true;
    setErreur("");
    setEquipementTrouve(ref);
  }

  // Caméra terrain : ne s'initialise que tant qu'aucun équipement n'a été
  // trouvé (sinon la Fiche Technique remplace complètement cette popup, et
  // on n'a plus besoin de la caméra).
  //
  // React (StrictMode, en développement uniquement) monte l'effet, le
  // nettoie, puis le remonte aussitôt pour vérifier qu'il est bien
  // "rejouable". Html5QrcodeScanner insère ses propres boutons/éléments
  // dans le conteneur et son scanner.clear() est asynchrone : si un second
  // scanner démarre avant que le premier ait fini de se nettoyer, on se
  // retrouve avec deux jeux de boutons "Stop Scanning" et une erreur
  // "removeChild" quand l'un des deux essaie de retirer un nœud déjà
  // supprimé par l'autre. On vide donc le conteneur nous-mêmes avant de
  // créer un nouveau scanner, et à nouveau si le clear() échoue.
  useEffect(() => {
    if (equipementTrouve) return undefined;

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
          // Appelé à chaque frame sans QR détecté — signe que la caméra tourne bien.
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
  }, [equipementTrouve]);

  // Portail vers document.body : ce composant est monté depuis la sidebar
  // (bouton "Scanner QR Code"), qui fixe elle-même une couleur de texte
  // claire pour son propre fond sombre (.sidebar { color: #EFE9DF }). Sans
  // portail, la popup héritait de ce texte clair alors que son fond à elle
  // est clair aussi — texte quasi invisible. Le portail sort la popup de
  // l'arbre DOM de la sidebar, donc plus aucun héritage de style parasite.
  if (equipementTrouve) {
    return createPortal(
      <FicheTechniqueModal id={equipementTrouve} onClose={onClose} />,
      document.body,
    );
  }

  function accéder(e) {
    e.preventDefault();
    traiterIdentifiant(identifiant);
  }

  return createPortal(
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
          <h2 style={{ fontSize: 17 }}>Scanner un équipement</h2>
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

        <form onSubmit={accéder}>
          <div className="field">
            <label>Ou saisir manuellement l'identifiant de l'équipement</label>
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
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
