<?php

namespace App\Modules\GroupeEquipement;

use App\Http\Controllers\Controller;
use App\Modules\GroupeEquipement\Requests\StoreGroupeEquipementRequest;
use App\Modules\GroupeEquipement\Requests\UpdateGroupeEquipementRequest;

// CRUD de la page "Données de base > Groupes" (réservée au super admin côté
// client, voir Sidebar.jsx / hasPermission("utilisateurs.manage")).
class GroupeEquipementController extends Controller
{
    public function index()
    {
        return GroupeEquipement::orderBy('libelle')->get();
    }

    public function store(StoreGroupeEquipementRequest $request)
    {
        return response()->json(GroupeEquipement::create($request->validated()), 201);
    }

    public function update(UpdateGroupeEquipementRequest $request, $id)
    {
        $groupe = GroupeEquipement::findOrFail($id);

        $groupe->update($request->validated());

        return $groupe;
    }

    public function destroy($id)
    {
        GroupeEquipement::findOrFail($id)->delete();

        return response()->json(['message' => 'Groupe supprimé.']);
    }
}
