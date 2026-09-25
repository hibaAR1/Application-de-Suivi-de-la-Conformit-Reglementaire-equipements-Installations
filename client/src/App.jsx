import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./modules/auth/ProtectedRoute";
import AppLayout from "./modules/layout/AppLayout";
import Login from "./modules/auth/Login";
import ChangerMotDePasse from "./modules/auth/ChangerMotDePasse";
import Dashboard from "./modules/dashboard/Dashboard";
import EquipementsListe from "./modules/equipements/EquipementsListe";
import EquipementForm from "./modules/equipements/EquipementForm";
import Controles from "./modules/controles/Controles";
import ReserveForm from "./modules/reserves/ReserveForm";
import Groupe from "./modules/groupe-consolide/Groupe";
import MobileControl from "./modules/scan/MobileControl";
import ScanSimule from "./modules/scan/ScanSimule";
import Utilisateurs from "./modules/utilisateurs/Utilisateurs";
import UtilisateurForm from "./modules/utilisateurs/UtilisateurForm";
import GroupesEquipementAdmin from "./modules/equipements/GroupesEquipementAdmin";
import TypesEquipementAdmin from "./modules/equipements/TypesEquipementAdmin";
import RolesAdmin from "./modules/roles/RolesAdmin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/changer-mot-de-passe" element={<ChangerMotDePasse />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipements" element={<EquipementsListe />} />
            <Route
              path="/equipements/fixes"
              element={<Navigate to="/equipements" replace />}
            />
            <Route path="/equipements/nouveau" element={<EquipementForm />} />
            <Route
              path="/equipements/:ref/modifier"
              element={<EquipementForm />}
            />
            <Route path="/controles" element={<Controles />} />
            <Route path="/reserves/:id/lever" element={<ReserveForm />} />
            <Route path="/groupe" element={<Groupe />} />
            <Route path="/scan" element={<ScanSimule />} />
            <Route path="/scan/:id" element={<MobileControl />} />
            <Route path="/mobile-control" element={<MobileControl />} />
            <Route path="/scanner" element={<ScanSimule />} />
            <Route path="/utilisateurs" element={<Utilisateurs />} />
            <Route path="/utilisateurs/nouveau" element={<UtilisateurForm />} />
            <Route path="/utilisateurs/:id" element={<UtilisateurForm />} />
            <Route
              path="/donnees-base"
              element={<Navigate to="/donnees-base/groupes" replace />}
            />
            <Route
              path="/donnees-base/groupes"
              element={<GroupesEquipementAdmin />}
            />
            <Route
              path="/donnees-base/types"
              element={<TypesEquipementAdmin />}
            />
            <Route path="/roles" element={<RolesAdmin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
