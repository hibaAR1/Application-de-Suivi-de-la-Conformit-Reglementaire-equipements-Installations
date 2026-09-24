<?php

namespace App\Modules\TypeEquipement\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTypeEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'libelle' => 'required|string|max:150|unique:type_equipement,libelle',
            'categorie' => 'required|string|max:50',
            'periodicite_controle' => 'required|integer|min:1',
            'caracteristiques' => 'nullable|array',
            'caracteristiques.*' => 'string|max:100',
        ];
    }
}
