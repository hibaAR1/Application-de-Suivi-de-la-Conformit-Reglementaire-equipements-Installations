import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await login(email, motDePasse);
      navigate(from, { replace: true });
    } catch (err) {
      setErreur(err.message || "Identifiants invalides");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div
          className="brand"
          style={{ justifyContent: "center", marginBottom: 24 }}
        >
          <div className="brand-mark">MH</div>
          <div className="brand-text">
            Ménara Holding
            <span>Suivi de la Conformité Réglementaire</span>
          </div>
        </div>

        <h1 className="login-title">Connexion</h1>

        {erreur && <div className="login-error">{erreur}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@menara.ma"
              required
              autoFocus
            />
          </label>

          <label className="login-label">
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="login-submit" disabled={chargement}>
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="login-footer">
          Accès réservé aux comptes autorisés par la Direction SMI.
        </p>
      </div>
    </div>
  );
}
