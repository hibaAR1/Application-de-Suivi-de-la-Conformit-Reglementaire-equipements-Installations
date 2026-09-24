<?php

namespace App\Modules\Controle\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreControleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'id_equipement' => 'required|string|exists:equipement,id_equipement',
            'date_controle' => 'required|date',
            'organisme_controle' => 'required|string',
            'resultat_global' => 'required|in:Favorable,Favorable avec réserves,Défavorable',
            'rapport' => 'nullable|file|mimes:pdf|max:10240', // PDF, 10 Mo max (CDC 3.2)
            'reserves' => 'nullable|array',
            'reserves.0.nature_reserve' => 'required_if:resultat_global,Favorable avec réserves|string',
            'reserves.0.niveau_criticite' => 'required_if:resultat_global,Favorable avec réserves|in:Mineure,Majeure,Bloquante',
        ];
    }
}
