import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";

// Le QR code généré par la Fiche Technique (voir FicheTechniqueModal.jsx,
// `valeurQr`) encode une URL complète — `${origin}/scan/{id}` — pas juste
// l'identifiant tout seul. On ne garde que le dernier segment de chemin
// dans ce cas, sinon on navigue vers "/scan/<url complète>" et la fiche ne
// se trouve jamais.
function extraireIdentifiant(texteBrut) {
  const texte = texteBrut.trim();
  try {
    const url = new URL(texte);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || texte;
  } catch {
    return texte;
  }
}

export default function ScanSimule() {
  const navigate = useNavigate();
  const conteneurId = "lecteur-qr";
  const dejaNavigue = useRef(false);
  const [etat, setEtat] = useState("attente"); // attente | actif | detecte
  const [refDetectee, setRefDetectee] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      conteneurId,
      { fps: 10, qrbox: 240 },
      false,
    );

    scanner.render(
      (texteDecode) => {
        if (dejaNavigue.current) return;
        dejaNavigue.current = true;
        const ref = extraireIdentifiant(texteDecode);
        setEtat("detecte");
        setRefDetectee(ref);
        scanner.clear().catch(() => {});
        setTimeout(() => navigate(`/scan/${ref}`), 900);
      },
      () => {
        // Appelé à chaque frame sans QR détecté — signe que la caméra tourne bien.
        setEtat((e) => (e === "attente" ? "actif" : e));
      },
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0B0A",
        color: "#EFE9DF",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ marginBottom: 4 }}>Scanner un équipement</h2>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 16 }}>
        Autorise l'accès à la caméra, puis vise le QR code collé sur
        l'équipement.
      </p>

      {/* Indicateur d'état : te dit en direct si ça scanne ou non */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 999,
          fontSize: 12.5,
          fontFamily: "'IBM Plex Mono',monospace",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 20,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${
            etat === "detecte"
              ? "#4CAF50"
              : etat === "actif"
                ? "var(--gold, #D4AF37)"
                : "rgba(239,233,223,0.3)"
          }`,
          color:
            etat === "detecte"
              ? "#4CAF50"
              : etat === "actif"
                ? "var(--gold, #D4AF37)"
                : "#EFE9DF",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "currentColor",
            animation:
              etat === "actif" ? "pulse-dot 1.1s ease-in-out infinite" : "none",
          }}
        />
        {etat === "attente" && "Initialisation de la caméra…"}
        {etat === "actif" && "Scan actif — recherche du QR code…"}
        {etat === "detecte" && `QR code détecté : ${refDetectee}`}
      </div>

      <div id={conteneurId} style={{ maxWidth: 420, margin: "0 auto" }} />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{
          marginTop: 24,
          background: "transparent",
          borderColor: "rgba(239,233,223,0.3)",
          color: "#EFE9DF",
        }}
      >
        Annuler
      </button>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
