<?php

namespace App\Modules\GroupeEquipement\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGroupeEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'libelle' => 'required|string|max:100|unique:groupe_equipement,libelle',
        ];
    }
}
