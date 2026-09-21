import { QRCodeSVG } from "qrcode.react";
import Plate from "./Plate";

export default function QRVisual({ valeur }) {
  return (
    <Plate
      className="qr-plate"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
      }}
    >
      <QRCodeSVG
        value={valeur || "inconnu"}
        size={96}
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    </Plate>
  );
}
