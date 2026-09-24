<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupeEquipement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// CRUD de la page "Données de base > Groupes" (réservée au super admin côté
// client, voir Sidebar.jsx / hasPermission("utilisateurs.manage")).
class GroupeEquipementController extends Controller
{
    public function index()
    {
        return GroupeEquipement::orderBy('libelle')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'libelle' => 'required|string|max:100|unique:groupe_equipement,libelle',
        ]);

        return response()->json(GroupeEquipement::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $groupe = GroupeEquipement::findOrFail($id);

        $data = $request->validate([
            'libelle' => [
                'required', 'string', 'max:100',
                Rule::unique('groupe_equipement', 'libelle')->ignore($id, 'id_groupe_equipement'),
            ],
        ]);

        $groupe->update($data);

        return $groupe;
    }

    public function destroy($id)
    {
        GroupeEquipement::findOrFail($id)->delete();

        return response()->json(['message' => 'Groupe supprimé.']);
    }
}
