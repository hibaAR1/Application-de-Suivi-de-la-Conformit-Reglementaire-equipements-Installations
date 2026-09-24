<?php

namespace App\Modules\Reserve\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReserveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'id_controle' => 'required|integer|exists:controle,id_controle',
            'nature_reserve' => 'required|string',
            'niveau_criticite' => 'required|in:Mineure,Majeure,Bloquante',
            'delai_levee' => 'nullable|date',
        ];
    }
}
