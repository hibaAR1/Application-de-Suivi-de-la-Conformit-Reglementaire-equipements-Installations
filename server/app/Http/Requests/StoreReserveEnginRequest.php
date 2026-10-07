<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReserveEnginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'id_controle_engin' => 'required|integer|exists:controle_engin,id_controle_engin',
            'nature_reserve' => 'required|string',
            'niveau_criticite' => 'required|in:Mineure,Majeure,Critique',
            'delai_levee' => 'nullable|date',
        ];
    }
}
