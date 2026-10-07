<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/*
 * ============================================================================
 * VALIDATION : enregistrement d'un contrôle d'engin  (POST /api/controles-engin)
 * ============================================================================
 *
 * RÔLE
 *   Vérifie les données du formulaire "Nouveau contrôle" d'un engin : le
 *   contrôle lui-même, son rapport PDF (facultatif) et, si le résultat est
 *   "Favorable avec réserves", la réserve à créer en même temps.
 *
 * LÉGENDE DES RÈGLES
 *   required    = obligatoire        nullable    = peut rester vide
 *   required_if = obligatoire seulement si une autre valeur est choisie
 * ============================================================================
 */
class StoreControleEnginRequest extends FormRequest
{
    // L'accès est déjà contrôlé par le middleware d'authentification et de
    // permission de la route : ici on autorise donc toujours.
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // --- Le contrôle ---
            // L'engin doit exister dans la table "engin".
            'id_engin' => 'required|string|exists:engin,id_engin',
            'date_controle' => 'required|date',
            'organisme_controle' => 'required|string',
            'resultat_global' => 'required|in:Favorable,Favorable avec réserves,Défavorable',

            // --- Rapport PDF (facultatif) : PDF uniquement, 10 Mo maximum ---
            'rapport' => 'nullable|file|mimes:pdf|max:10240',

            // --- Réserve créée avec le contrôle ---
            // Une seule réserve est envoyée (index 0). Sa nature et sa
            // criticité sont obligatoires uniquement si le résultat est
            // "Favorable avec réserves".
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
