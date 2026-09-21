<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    public function index()
    {
        return Utilisateur::with(['role', 'filiales'])->get();
    }

    public function show($id)
    {
        return Utilisateur::with(['role', 'filiales'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:150',
            'email' => 'required|email|unique:utilisateur',
            'mot_de_passe' => 'required|string|min:8',
            'id_role' => 'required|integer|exists:role,id_role',
            'id_filiales' => 'nullable|array',
            'id_filiales.*' => 'integer|exists:filiale,id_filiale',
        ]);

        $idFiliales = $data['id_filiales'] ?? [];
        unset($data['id_filiales']);
        $data['mot_de_passe'] = Hash::make($data['mot_de_passe']);

        $utilisateur = Utilisateur::create($data);
        $utilisateur->filiales()->sync($idFiliales);

        return $utilisateur->load(['role', 'filiales']);
    }

    public function update(Request $request, $id)
    {
        $utilisateur = Utilisateur::findOrFail($id);

        $data = $request->validate([
            'nom' => 'sometimes|string|max:150',
            'email' => 'sometimes|email|unique:utilisateur,email,' . $id . ',id_utilisateur',
            'id_role' => 'sometimes|integer|exists:role,id_role',
            'id_filiales' => 'nullable|array',
            'id_filiales.*' => 'integer|exists:filiale,id_filiale',
            'actif' => 'sometimes|boolean',
        ]);

        if (array_key_exists('id_filiales', $data)) {
            $utilisateur->filiales()->sync($data['id_filiales'] ?? []);
            unset($data['id_filiales']);
        }

        $utilisateur->update($data);
        return $utilisateur->load(['role', 'filiales']);
    }

    public function destroy($id)
    {
        Utilisateur::findOrFail($id)->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}
