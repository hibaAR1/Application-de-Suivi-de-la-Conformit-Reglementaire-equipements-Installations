<?php

namespace App\Modules\Utilisateur\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUtilisateurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        $id = $this->route('utilisateur');

        return [
            'nom' => 'sometimes|string|max:150',
            'email' => 'sometimes|email|unique:utilisateur,email,' . $id . ',id_utilisateur',
            // Sans cette règle, un mot de passe envoyé par le formulaire
            // "Modifier utilisateur" était silencieusement ignoré (validated()
            // ne garde que les champs déclarés ici) : le changement ne se
            // faisait jamais, sans aucune erreur affichée à l'écran.
            'mot_de_passe' => 'sometimes|string|min:8',
            'id_role' => 'sometimes|integer|exists:role,id_role',
            'id_filiales' => 'nullable|array',
            'id_filiales.*' => 'integer|exists:filiale,id_filiale',
            'actif' => 'sometimes|boolean',
        ];
    }
}
