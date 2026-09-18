import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconQr } from "../components/icons";

const REF_SIMULEE = "CTM-0089";

export default function ScanSimule() {
  const navigate = useNavigate();
  const [detecte, setDetecte] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDetecte(true), 1400);
    const t2 = setTimeout(() => navigate(`/equipements/${REF_SIMULEE}`), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0B0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#EFE9DF",
      }}
    >
      <div
        style={{
          width: 240,
          height: 240,
          position: "relative",
          border: `2px solid ${
            detecte ? "var(--success, #4CAF50)" : "var(--gold, #D4AF37)"
          }`,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s",
        }}
      >
        {!detecte && (
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              height: 2,
              background: "var(--gold, #D4AF37)",
              animation: "scan-line 1.4s ease-in-out infinite",
            }}
          />
        )}
        <IconQr />
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 14,
          fontFamily: "'IBM Plex Mono',monospace",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {detecte
          ? `Équipement détecté : ${REF_SIMULEE}`
          : "Recherche du QR code…"}
      </div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{
          marginTop: 32,
          background: "transparent",
          borderColor: "rgba(239,233,223,0.3)",
          color: "#EFE9DF",
        }}
      >
        Annuler
      </button>
      <style>{`
        @keyframes scan-line {
          0% { top: 8px; }
          50% { top: calc(100% - 10px); }
          100% { top: 8px; }
        }
      `}</style>
    </div>
  );
}
