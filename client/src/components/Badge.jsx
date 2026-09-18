// tone attendu : 'success' | 'warning' | 'danger'
export default function Badge({ tone, children }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
