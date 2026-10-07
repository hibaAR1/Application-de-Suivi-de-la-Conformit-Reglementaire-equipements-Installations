import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./modules/auth/ProtectedRoute";
import AppLayout from "./modules/layout/AppLayout";
import Login from "./modules/auth/Login";
import ChangerMotDePasse from "./modules/auth/ChangerMotDePasse";
import Dashboard from "./modules/dashboard/Dashboard";
import EquipementsListe from "./modules/equipements/EquipementsListe";
import EquipementForm from "./modules/equipements/EquipementForm";
import EnginsListe from "./modules/engins/EnginsListe";
import EnginForm from "./modules/engins/EnginForm";
import ReserveEnginForm from "./modules/engins/ReserveEnginForm";
import ReserveForm from "./modules/reserves/ReserveForm";
import ReservesPlanAction from "./modules/reserves/ReservesPlanAction";
import Utilisateurs from "./modules/utilisateurs/Utilisateurs"; // AJOUTE
import UtilisateurForm from "./modules/utilisateurs/UtilisateurForm"; // AJOUTE
import GroupesEquipementAdmin from "./modules/equipements/GroupesEquipementAdmin";
import TypesEquipementAdmin from "./modules/equipements/TypesEquipementAdmin";
import RolesAdmin from "./modules/roles/RolesAdmin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          {/* Hors AppLayout (pas de sidebar) : tant que doitChangerMotPasse
              est vrai, ProtectedRoute renvoie ici quelle que soit la page
              demandée. */}
          <Route path="/changer-mot-de-passe" element={<ChangerMotDePasse />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/equipements"
              element={<EquipementsListe key="tous" />}
            />
            {/* Ancienne page "Équipements fixes" (filtre "Fixe" forcé) :
                redirige vers la liste complète, sans présélection. */}
            <Route
              path="/equipements/fixes"
              element={<Navigate to="/equipements" replace />}
            />
            {/* Engins : table "engin" séparée de "equipement" (plus un simple
                filtre "Mobile" de la liste des équipements). */}
            <Route path="/engins-mobiles" element={<EnginsListe />} />
            <Route path="/engins-mobiles/nouveau" element={<EnginForm />} />
            <Route
              path="/engins-mobiles/:ref/modifier"
              element={<EnginForm />}
            />
            {/* Les réserves des engins s'affichent maintenant dans la page
                unique "Réserves & Plan d'action" (/reserves). Cette ancienne
                adresse y redirige, pour ne pas casser d'éventuels favoris. */}
            <Route
              path="/engins-mobiles/reserves"
              element={<Navigate to="/reserves" replace />}
            />
            <Route
              path="/engins-mobiles/reserves/:id/lever"
              element={<ReserveEnginForm />}
            />
            <Route path="/equipements/nouveau" element={<EquipementForm />} />
            <Route
              path="/equipements/:ref/modifier"
              element={<EquipementForm />}
            />
            <Route path="/reserves" element={<ReservesPlanAction />} />
            <Route path="/reserves/:id/lever" element={<ReserveForm />} />
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
