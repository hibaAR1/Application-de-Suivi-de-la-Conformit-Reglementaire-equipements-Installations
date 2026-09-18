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
}
