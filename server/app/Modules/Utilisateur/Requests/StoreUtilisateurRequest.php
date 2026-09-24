<?php

namespace App\Modules\Utilisateur\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUtilisateurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:150',
            'email' => 'required|email|unique:utilisateur',
            'mot_de_passe' => 'required|string|min:8',
            'id_role' => 'required|integer|exists:role,id_role',
            'id_filiales' => 'nullable|array',
            'id_filiales.*' => 'integer|exists:filiale,id_filiale',
        ];
    }
}
