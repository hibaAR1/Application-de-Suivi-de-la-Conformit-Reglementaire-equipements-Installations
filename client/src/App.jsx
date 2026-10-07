/*
 * ============================================================================
 * APPLICATION : table des routes (adresses -> pages)
 * ============================================================================
 *
 * ORGANISATION
 *   - /login : page publique
 *   - Toutes les autres pages passent par ProtectedRoute (connexion
 *     obligatoire) :
 *       · /changer-mot-de-passe : sans menu latéral
 *       · pages avec menu latéral (AppLayout) : tableau de bord, équipements,
 *         engins, réserves, utilisateurs, données de base, rôles
 *
 * Les droits d'accès par permission sont vérifiés dans les écrans (masquage
 * des boutons, du menu) et surtout côté serveur (routes/api.php).
 * ============================================================================
 */
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
import Utilisateurs from "./modules/utilisateurs/Utilisateurs";
import UtilisateurForm from "./modules/utilisateurs/UtilisateurForm";
import GroupesEquipementAdmin from "./modules/equipements/GroupesEquipementAdmin";
import TypesEquipementAdmin from "./modules/equipements/TypesEquipementAdmin";
import RolesAdmin from "./modules/roles/RolesAdmin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page publique */}
        <Route path="/login" element={<Login />} />

        {/* Pages protégées : l'utilisateur doit être connecté */}
        <Route element={<ProtectedRoute />}>
          {/* Hors AppLayout (pas de menu latéral) : tant que
              doitChangerMotPasse est vrai, ProtectedRoute renvoie ici quelle
              que soit la page demandée. */}
          <Route path="/changer-mot-de-passe" element={<ChangerMotDePasse />} />
          {/* Pages avec menu latéral */}
          <Route element={<AppLayout />}>
            {/* Tableau de bord */}
            <Route path="/" element={<Dashboard />} />
            {/* Équipements */}
            <Route
              path="/equipements"
              element={<EquipementsListe key="tous" />}
            />
            {/* L'adresse "/equipements/fixes" redirige vers la liste
                complète, sans filtre présélectionné. */}
            <Route
              path="/equipements/fixes"
              element={<Navigate to="/equipements" replace />}
            />
            {/* Engins : table "engin" séparée de "equipement" (ce n'est pas un
                simple filtre "Mobile" de la liste des équipements). */}
            <Route path="/engins-mobiles" element={<EnginsListe />} />
            <Route path="/engins-mobiles/nouveau" element={<EnginForm />} />
            <Route
              path="/engins-mobiles/:ref/modifier"
              element={<EnginForm />}
            />
            {/* Les réserves des engins s'affichent dans la page unique
                "Réserves & Plan d'action" (/reserves). Cette adresse y
                redirige, pour que d'éventuels favoris continuent de
                fonctionner. */}
            <Route
              path="/engins-mobiles/reserves"
              element={<Navigate to="/reserves" replace />}
            />
            <Route
              path="/engins-mobiles/reserves/:id/lever"
              element={<ReserveEnginForm />}
            />
            {/* Création et modification d'un équipement */}
            <Route path="/equipements/nouveau" element={<EquipementForm />} />
            <Route
              path="/equipements/:ref/modifier"
              element={<EquipementForm />}
            />
            {/* Réserves & Plan d'action (équipements et engins ensemble) et
                levée d'une réserve d'équipement */}
            <Route path="/reserves" element={<ReservesPlanAction />} />
            <Route path="/reserves/:id/lever" element={<ReserveForm />} />
            {/* Utilisateurs : liste, création, modification */}
            <Route path="/utilisateurs" element={<Utilisateurs />} />{" "}
            <Route path="/utilisateurs/nouveau" element={<UtilisateurForm />} />{" "}
            <Route path="/utilisateurs/:id" element={<UtilisateurForm />} />{" "}
            {/* Données de base : groupes et types d'équipement (utilisés
                aussi par les engins) */}
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
            {/* Rôles et permissions */}
            <Route path="/roles" element={<RolesAdmin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
