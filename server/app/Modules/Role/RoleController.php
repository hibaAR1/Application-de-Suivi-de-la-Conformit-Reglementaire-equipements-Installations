<?php

namespace App\Modules\Role;

use App\Http\Controllers\Controller;
use App\Modules\Role\Requests\StoreRoleRequest;
use App\Modules\Role\Requests\UpdateRoleRequest;
use App\Modules\Role\Resources\RoleResource;
use Illuminate\Database\QueryException;

class RoleController extends Controller
{
    // Charge toujours les permissions : la page "Gestion des rôles /
    // permissions" (RolesAdmin.jsx) en a besoin pour afficher la matrice
    // rôle x permission sans un aller-retour par rôle.
    public function index()
    {
        return RoleResource::collection(Role::with('permissions')->get());
    }

    public function show($id)
    {
        return new RoleResource(Role::with('permissions')->findOrFail($id));
    }

    // "+" à côté du champ Rôle dans UtilisateurForm.jsx, et bouton "Nouveau
    // rôle" de la page "Gestion des rôles" : crée le rôle, et si des
    // permissions sont cochées dès la création, les attache directement.
    public function store(StoreRoleRequest $request)
    {
        $data = $request->validated();
        $idPermissions = $data['id_permissions'] ?? [];

        $role = Role::create([
            'libelle' => $data['libelle'],
            'description' => $data['description'] ?? null,
        ]);
        $role->permissions()->sync($idPermissions);

        return response()->json(new RoleResource($role->load('permissions')), 201);
    }

    // Sert à la fois à renommer/décrire un rôle ET à (re)définir la liste de
    // ses permissions (page "Affecter des permissions par rôle") : un seul
    // endpoint, id_permissions remplace entièrement la liste actuelle.
    public function update(UpdateRoleRequest $request, $id)
    {
        $role = Role::findOrFail($id);
        $data = $request->validated();

        $role->update([
            'libelle' => $data['libelle'],
            'description' => $data['description'] ?? null,
        ]);

        if (array_key_exists('id_permissions', $data)) {
            $role->permissions()->sync($data['id_permissions'] ?? []);
        }

        return new RoleResource($role->load('permissions'));
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        try {
            $role->delete();
        } catch (QueryException $e) {
            // Contrainte de clé étrangère : des utilisateurs ont encore ce rôle.
            abort(422, "Impossible de supprimer : des utilisateurs ont encore ce rôle.");
        }

        return response()->json(['message' => 'Rôle supprimé.']);
    }
}
