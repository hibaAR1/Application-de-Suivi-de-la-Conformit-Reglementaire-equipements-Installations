<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/*
 * ============================================================================
 * VALIDATION : création d'un engin  (POST /api/engins)
 * ============================================================================
 *
 * RÔLE
 *   Vérifie les données envoyées par le formulaire avant d'enregistrer un
 *   nouvel engin. Si une règle n'est pas respectée, Laravel renvoie
 *   automatiquement une erreur 422 avec le détail des champs invalides.
 *
 * LÉGENDE DES RÈGLES
 *   required = obligatoire     nullable = peut rester vide
 *   sometimes = vérifié seulement s'il est envoyé
 * ============================================================================
 */
class StoreEnginRequest extends FormRequest
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
            // "id_engin" et "referentiel" ne sont pas demandés : ils sont
            // générés par le serveur (voir EnginController::store).

            // --- Rattachement ---
            'id_filiale' => 'required|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'required|integer',

            // --- Informations générales ---
            'designation' => 'required|string|max:100',
            'marque_modele' => 'nullable|string',
            // Le numéro de série est unique dans toute la table "engin".
            'numero_serie' => 'required|string|unique:engin',
            'date_mise_en_service' => 'required|date',
            'periodicite_mois' => 'nullable|integer|min:1',
            'statut' => 'nullable|in:Conforme,Conforme avec réserve,Non conforme',

            // --- Détails techniques ---
            'qr_code' => 'nullable|string',
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
