<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEnginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        $id = $this->route('engin');

        return [
            'id_filiale' => 'sometimes|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'sometimes|integer',
            'designation' => 'sometimes|string|max:100',
            'marque_modele' => 'nullable|string',
            'numero_serie' => ['sometimes', 'string', Rule::unique('engin')->ignore($id, 'id_engin')],
            'date_mise_en_service' => 'sometimes|date',
            'periodicite_mois' => 'nullable|integer|min:1',
            'statut' => 'sometimes|in:Conforme,Conforme avec réserve,Non conforme',
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            'caracteristiques' => 'nullable|array',
        ];
    }
}
