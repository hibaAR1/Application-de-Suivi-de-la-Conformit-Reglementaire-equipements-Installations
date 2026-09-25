<?php

namespace App\Modules\Auth;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Requests\ChangerMotDePasseRequest;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Utilisateur\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $data = $request->validated();

        $utilisateur = Utilisateur::where('email', $data['email'])->first();

        if (! $utilisateur || ! Hash::check($data['mot_de_passe'], $utilisateur->mot_de_passe)) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        $token = $utilisateur->createToken('token-api')->plainTextToken;

        return response()->json([
            'utilisateur' => $utilisateur->load(['role.permissions', 'filiales']),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }

    public function me(Request $request)
    {
        return $request->user()->load(['role.permissions', 'filiales']);
    }

    // Changement de mot de passe obligatoire au premier login (voir
    // UtilisateurController::store(), qui force doit_changer_mot_passe=true
    // à la création). Demande aussi le mot de passe actuel, même dans ce
    // cas-là, par sécurité (évite qu'une session volée puisse changer le mot
    // de passe sans le connaître).
    public function changerMotDePasse(ChangerMotDePasseRequest $request)
    {
        $data = $request->validated();
        $utilisateur = $request->user();

        if (! Hash::check($data['mot_de_passe_actuel'], $utilisateur->mot_de_passe)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.'], 422);
        }

        $utilisateur->update([
            'mot_de_passe' => Hash::make($data['nouveau_mot_de_passe']),
            'doit_changer_mot_passe' => false,
        ]);

        return response()->json([
            'utilisateur' => $utilisateur->fresh()->load(['role.permissions', 'filiales']),
        ]);
    }
}
