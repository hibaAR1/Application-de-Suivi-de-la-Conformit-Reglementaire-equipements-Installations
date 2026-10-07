<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreControleEnginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'id_engin' => 'required|string|exists:engin,id_engin',
            'date_controle' => 'required|date',
            'organisme_controle' => 'required|string',
            'resultat_global' => 'required|in:Favorable,Favorable avec réserves,Défavorable',
            'rapport' => 'nullable|file|mimes:pdf|max:10240', // PDF, 10 Mo max (CDC 3.2)
            'reserves' => 'nullable|array',
            'reserves.0.nature_reserve' => 'required_if:resultat_global,Favorable avec réserves|string',
            'reserves.0.niveau_criticite' => 'required_if:resultat_global,Favorable avec réserves|in:Mineure,Majeure,Critique',
            'reserves.0.responsable' => 'nullable|string',
            'reserves.0.action_corrective' => 'nullable|string',
            // Échéance : calculée automatiquement selon la criticité (voir
            // ControleEnginController::DELAI_LEVEE_JOURS), mais l'utilisateur peut
            // la modifier à la main dans le formulaire "Ajouter une réserve".
            'reserves.0.delai_levee' => 'nullable|date',
        ];
    }
}
