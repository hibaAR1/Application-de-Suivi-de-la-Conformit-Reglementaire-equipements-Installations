<?php

namespace App\Http\Controllers;

use App\Models\GroupeEquipement;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGroupeEquipementRequest;
use App\Http\Requests\UpdateGroupeEquipementRequest;
use App\Http\Resources\GroupeEquipementResource;

// CRUD de la page "Données de base > Groupes" (réservée au super admin côté
// client, voir Sidebar.jsx / hasPermission("utilisateurs.manage")).
class GroupeEquipementController extends Controller
{
    public function index()
    {
        return GroupeEquipementResource::collection(GroupeEquipement::orderBy('libelle')->get());
    }

    public function store(StoreGroupeEquipementRequest $request)
    {
        return response()->json(new GroupeEquipementResource(GroupeEquipement::create($request->validated())), 201);
    }

    public function update(UpdateGroupeEquipementRequest $request, $id)
    {
        $groupe = GroupeEquipement::findOrFail($id);

        $groupe->update($request->validated());

        return new GroupeEquipementResource($groupe);
    }

    public function destroy($id)
    {
        GroupeEquipement::findOrFail($id)->delete();

        return response()->json(['message' => 'Groupe supprimé.']);
    }
}
