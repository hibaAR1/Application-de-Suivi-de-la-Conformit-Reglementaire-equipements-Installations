<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/*
 * ============================================================================
 * VALIDATION : ajout d'une réserve sur un engin  (POST /api/reserves-engin)
 * ============================================================================
 *
 * RÔLE
 *   Vérifie les données du formulaire "Ajouter une réserve" : une réserve
 *   est un défaut relevé lors d'un contrôle existant de l'engin.
 *
 * LÉGENDE DES RÈGLES
 *   required = obligatoire     nullable = peut rester vide
 * ============================================================================
 */
class StoreReserveEnginRequest extends FormRequest
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
            // Le contrôle auquel la réserve est rattachée doit exister.
            'id_controle_engin' => 'required|integer|exists:controle_engin,id_controle_engin',
            'nature_reserve' => 'required|string',
            'niveau_criticite' => 'required|in:Mineure,Majeure,Critique',
            // Échéance de levée : date limite pour corriger la réserve
            // (facultative).
            'delai_levee' => 'nullable|date',
        ];
    }
}
