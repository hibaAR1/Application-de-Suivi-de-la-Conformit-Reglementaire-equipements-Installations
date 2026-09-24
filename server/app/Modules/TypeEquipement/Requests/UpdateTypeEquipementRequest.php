<?php

namespace App\Modules\TypeEquipement\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTypeEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'libelle' => [
                'required', 'string', 'max:150',
                Rule::unique('type_equipement', 'libelle')->ignore($id, 'id_type_equipement'),
            ],
            'categorie' => 'required|string|max:50',
            'periodicite_controle' => 'required|integer|min:1',
            'caracteristiques' => 'nullable|array',
            'caracteristiques.*' => 'string|max:100',
        ];
    }
}
