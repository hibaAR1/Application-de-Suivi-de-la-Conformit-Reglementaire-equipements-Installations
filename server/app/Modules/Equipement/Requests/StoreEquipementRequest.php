<?php

namespace App\Modules\Equipement\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            // id_equipement / referentiel : générés ici côté serveur (voir
            // EquipementController::store), jamais acceptés du client — un
            // identifiant calculé côté React à partir de la liste chargée en
            // mémoire pouvait entrer en collision avec un équipement déjà créé
            // ailleurs (autre onglet, tests successifs, liste locale pas à
            // jour), d'où des erreurs "id equipement has already been taken".
            'id_filiale' => 'required|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'required|integer',
            'designation' => 'required|string|max:100',
            'marque_modele' => 'nullable|string',
            'numero_serie' => 'required|string|unique:equipement',
            'date_mise_en_service' => 'required|date',
            'periodicite_mois' => 'nullable|integer|min:1',
            'statut' => 'nullable|in:Conforme,Conforme avec réserve,Non conforme',

            'qr_code' => 'nullable|string',
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            'caracteristiques' => 'nullable|array',
        ];
    }
}
