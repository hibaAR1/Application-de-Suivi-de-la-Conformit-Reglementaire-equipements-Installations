import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Enveloppe les routes qui exigent d'être connecté.
// Redirige vers /login en gardant en mémoire la page demandée (state.from),
// pour y renvoyer l'utilisateur juste après connexion.
export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Changement de mot de passe obligatoire au premier login (compte créé
  // par un admin, mot de passe temporaire) : tant que ce n'est pas fait, on
  // bloque l'accès à tout le reste de l'appli — quelle que soit la page
  // demandée au départ — sauf à la page de changement elle-même (sinon
  // boucle de redirection infinie).
  if (
    user?.doitChangerMotPasse &&
    location.pathname !== "/changer-mot-de-passe"
  ) {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  return <Outlet />;
}
