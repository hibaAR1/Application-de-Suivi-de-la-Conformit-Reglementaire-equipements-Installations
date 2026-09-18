// Jauge à arc de 270° (comme un cadran d'instrument industriel).
// percent : 0-100
export default function Gauge({ percent }) {
  const dash = (percent * 0.75).toFixed(1);
  return (
    <div style={{ position: 'relative', width: 132, height: 132 }}>
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle
          cx="66" cy="66" r="56" fill="none" stroke="var(--border)" strokeWidth="10"
          strokeLinecap="round" pathLength="100" strokeDasharray="75 100"
          transform="rotate(135 66 66)"
        />
        <circle
          cx="66" cy="66" r="56" fill="none" stroke="var(--gold)" strokeWidth="10"
          strokeLinecap="round" pathLength="100" strokeDasharray={`${dash} 100`}
          transform="rotate(135 66 66)"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="gauge-num">{percent}%</div>
      </div>
    </div>
  );
}
