import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Enveloppe les routes qui exigent d'être connecté.
// Redirige vers /login en gardant en mémoire la page demandée (state.from),
// pour y renvoyer l'utilisateur juste après connexion.
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
