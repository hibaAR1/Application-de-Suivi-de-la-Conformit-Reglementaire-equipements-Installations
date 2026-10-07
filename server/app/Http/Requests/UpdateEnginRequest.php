<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/*
 * ============================================================================
 * VALIDATION : modification d'un engin  (PUT /api/engins/{engin})
 * ============================================================================
 *
 * RÔLE
 *   Vérifie les données envoyées lors de la modification d'un engin.
 *   Contrairement à la création, les champs obligatoires sont en
 *   "sometimes" : on ne les vérifie que s'ils sont présents, ce qui permet
 *   de modifier un seul champ à la fois.
 *
 * LÉGENDE DES RÈGLES
 *   sometimes = vérifié seulement s'il est envoyé
 *   nullable  = peut rester vide
 * ============================================================================
 */
class UpdateEnginRequest extends FormRequest
{
    // L'accès est déjà contrôlé par le middleware d'authentification et de
    // permission de la route : ici on autorise donc toujours.
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Identifiant de l'engin modifié (pris dans l'URL).
        $id = $this->route('engin');

        return [
            // --- Rattachement ---
            'id_filiale' => 'sometimes|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'sometimes|integer',

            // --- Informations générales ---
            'designation' => 'sometimes|string|max:100',
            'marque_modele' => 'nullable|string',
            // Numéro de série unique, en ignorant l'engin en cours de
            // modification (sinon il serait en conflit avec lui-même).
            'numero_serie' => ['sometimes', 'string', Rule::unique('engin')->ignore($id, 'id_engin')],
            'date_mise_en_service' => 'sometimes|date',
            'periodicite_mois' => 'nullable|integer|min:1',
            'statut' => 'sometimes|in:Conforme,Conforme avec réserve,Non conforme',

            // --- Détails techniques ---
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            // Caractéristiques propres au type d'engin (clé => valeur).
            'caracteristiques' => 'nullable|array',
        ];
    }
}
