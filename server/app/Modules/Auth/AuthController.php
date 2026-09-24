<?php

namespace App\Modules\Auth;

use App\Http\Controllers\Controller;
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
}
