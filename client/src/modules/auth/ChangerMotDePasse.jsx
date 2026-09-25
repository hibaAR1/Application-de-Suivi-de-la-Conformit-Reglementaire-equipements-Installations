import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Passage obligatoire après le premier login d'un utilisateur créé par un
// admin (mot de passe temporaire) — voir ProtectedRoute.jsx qui redirige
// automatiquement ici tant que user.doitChangerMotPasse est vrai, quelle
// que soit la page demandée au départ.
export default function ChangerMotDePasse() {
  const { changerMotDePasse, logout } = useAuth();
  const navigate = useNavigate();

  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);

    if (nouveauMotDePasse.length < 8) {
      setErreur("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (nouveauMotDePasse !== confirmation) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setChargement(true);
    try {
      await changerMotDePasse(
        motDePasseActuel,
        nouveauMotDePasse,
        confirmation,
      );
      navigate("/", { replace: true });
    } catch (err) {
      setErreur(err.message || "Erreur lors du changement de mot de passe.");
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

        <h1 className="login-title">Changement de mot de passe</h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: -8,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          Pour continuer, choisis un nouveau mot de passe (obligatoire à ta
          première connexion).
        </p>

        {erreur && <div className="login-error">{erreur}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Mot de passe actuel
            <input
              type="password"
              value={motDePasseActuel}
              onChange={(e) => setMotDePasseActuel(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
            />
          </label>

          <label className="login-label">
            Nouveau mot de passe
            <input
              type="password"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              placeholder="8 caractères minimum"
              required
              minLength={8}
            />
          </label>

          <label className="login-label">
            Confirmer le nouveau mot de passe
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </label>

          <button type="submit" className="login-submit" disabled={chargement}>
            {chargement
              ? "Enregistrement..."
              : "Valider le nouveau mot de passe"}
          </button>
        </form>

        <p className="login-footer">
          <button
            type="button"
            onClick={logout}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 12.5,
              padding: 0,
            }}
          >
            Se déconnecter
          </button>
        </p>
      </div>
    </div>
  );
}
