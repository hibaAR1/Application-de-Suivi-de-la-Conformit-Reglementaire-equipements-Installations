import Plate from './Plate';

// ⚠️ Placeholder visuel uniquement, pas un vrai QR code scannable.
// Pour la vraie génération : lib "qrcode" côté backend (§3.1 du CDC) ou "qrcode.react" côté front.
const CELLS = [
  1, 0, 1, 1, 0, 1, 0, 1,
  0, 1, 0, 0, 1, 0, 1, 0,
  1, 1, 1, 0, 1, 1, 0, 1,
  0, 0, 1, 1, 0, 0, 1, 0,
  1, 0, 0, 1, 1, 1, 0, 1,
  0, 1, 1, 0, 0, 1, 1, 0,
  1, 1, 0, 1, 0, 0, 1, 1,
  0, 0, 1, 0, 1, 1, 0, 0,
];

export default function QRVisual() {
  return (
    <Plate className="qr-plate">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1.5px', width: '100%', height: '100%' }}>
        {CELLS.map((c, i) => (
          <div key={i} style={{ background: c ? 'var(--anthracite)' : 'transparent' }} />
        ))}
      </div>
    </Plate>
  );
}
