<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangerMotDePasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // utilisateur déjà authentifié via le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'mot_de_passe_actuel' => 'required|string',
            // "confirmed" exige un champ nouveau_mot_de_passe_confirmation
            // envoyé en plus par le front (voir AuthContext.jsx).
            'nouveau_mot_de_passe' => 'required|string|min:8|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'nouveau_mot_de_passe.confirmed' => 'La confirmation ne correspond pas au nouveau mot de passe.',
            'nouveau_mot_de_passe.min' => 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        ];
    }
}
