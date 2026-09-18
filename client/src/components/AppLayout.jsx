import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import AssistantWidget from './AssistantWidget';

// Enveloppe toutes les pages "connectées" (dashboard, équipements, groupe...).
// L'assistant réglementaire est un widget flottant présent partout ici,
// plutôt qu'une page dédiée (§3.3 du CDC — accessible en contexte, sans quitter l'écran en cours).
export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
      <BottomNav />
      <AssistantWidget />
    </div>
  );
}
