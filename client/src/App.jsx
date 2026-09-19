import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EquipementsListe from "./pages/EquipementsListe";
import Equipement from "./pages/Equipement";
import EquipementForm from "./pages/EquipementForm";
import Controles from "./pages/Controles";
import ReserveForm from "./pages/ReserveForm";
import Groupe from "./pages/Groupe";
import MobileControl from "./pages/MobileControl";
import ScanSimule from "./pages/ScanSimule";
import Utilisateurs from "./pages/Utilisateurs"; // AJOUTE
import UtilisateurForm from "./pages/UtilisateurForm"; // AJOUTE

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipements" element={<EquipementsListe />} />
            <Route path="/equipements/nouveau" element={<EquipementForm />} />
            <Route path="/equipements/:ref" element={<Equipement />} />
            <Route path="/controles" element={<Controles />} />
            <Route path="/controles/:id/reserve" element={<ReserveForm />} />
            <Route path="/groupe" element={<Groupe />} />
            <Route path="/scan" element={<ScanSimule />} />
            <Route path="/scan/:id" element={<MobileControl />} />
            <Route path="/mobile-control" element={<MobileControl />} />
            <Route path="/scanner" element={<ScanSimule />} />
            <Route path="/utilisateurs" element={<Utilisateurs />} />{" "}
            {/* AJOUTE */}
            <Route
              path="/utilisateurs/nouveau"
              element={<UtilisateurForm />}
            />{" "}
            {/* AJOUTE */}
            <Route
              path="/utilisateurs/:id"
              element={<UtilisateurForm />}
            />{" "}
            {/* AJOUTE */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
