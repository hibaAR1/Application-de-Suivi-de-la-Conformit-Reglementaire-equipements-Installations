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
        return Utilisateur::with(['role', 'filiale'])->get();
    }

    public function show($id)
    {
        return Utilisateur::with(['role', 'filiale'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:150',
            'email' => 'required|email|unique:utilisateur',
            'mot_de_passe' => 'required|string|min:8',
            'id_filiale' => 'nullable|integer|exists:filiale,id_filiale',
            'id_role' => 'required|integer|exists:role,id_role',
        ]);

        $data['mot_de_passe'] = Hash::make($data['mot_de_passe']);

        return Utilisateur::create($data);
    }
    // app/Http/Controllers/Api/UtilisateurController.php — ajoute ces 2 méthodes

public function update(Request $request, $id)
{
    $utilisateur = Utilisateur::findOrFail($id);

    $data = $request->validate([
        'nom' => 'sometimes|string|max:150',
        'email' => 'sometimes|email|unique:utilisateur,email,' . $id . ',id_utilisateur',
        'id_filiale' => 'nullable|integer|exists:filiale,id_filiale',
        'id_role' => 'sometimes|integer|exists:role,id_role',
        'actif' => 'sometimes|boolean',
    ]);

    $utilisateur->update($data);
    return $utilisateur->load(['role', 'filiale']);
}

public function destroy($id)
{
    Utilisateur::findOrFail($id)->delete();
    return response()->json(['message' => 'Utilisateur supprimé']);
}
}
