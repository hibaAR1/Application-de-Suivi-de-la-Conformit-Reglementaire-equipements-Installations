import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Avant : renvoyait vers la dernière page visitée avant déconnexion
  // (state.from), ce qui donnait l'impression que la connexion "atterrissait
  // n'importe où" (ex: sur Utilisateurs si c'était la dernière page
  // ouverte). Toujours vers le Tableau de bord maintenant.

  const [nom, setNom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await login(nom, motDePasse);
      navigate("/", { replace: true });
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
            Nom
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Jean Dupont"
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
