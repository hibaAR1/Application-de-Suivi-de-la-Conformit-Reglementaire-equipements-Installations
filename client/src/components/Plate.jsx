// Panneau avec coins style "plan technique" (petits crochets dorés).
// Utilisé partout à la place d'une simple carte pour garder l'identité visuelle.
export default function Plate({ children, style, className = '', ...rest }) {
  return (
    <div className={`plate ${className}`} style={style} {...rest}>
      {children}
      <span className="c3" />
      <span className="c4" />
    </div>
  );
}
