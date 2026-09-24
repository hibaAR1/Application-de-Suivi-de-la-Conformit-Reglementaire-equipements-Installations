<?php

namespace App\Modules\GroupeEquipement\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGroupeEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        // Route::apiResource('groupes-equipement', ...) : Laravel dérive le nom
        // du paramètre de liaison en remplaçant les tirets par des underscores,
        // d'où "groupes_equipement" en principe. On reste tolérant (fallback)
        // au cas où Laravel l'aurait plutôt singularisé en "groupe_equipement".
        $id = $this->route('groupes_equipement') ?? $this->route('groupe_equipement');

        return [
            'libelle' => [
                'required', 'string', 'max:100',
                Rule::unique('groupe_equipement', 'libelle')->ignore($id, 'id_groupe_equipement'),
            ],
        ];
    }
}
