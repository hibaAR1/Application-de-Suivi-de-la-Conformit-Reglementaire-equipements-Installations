<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/*
 * ============================================================================
 * VALIDATION : mise à jour d'une réserve d'engin  (PUT /api/reserves-engin/{id})
 * ============================================================================
 *
 * RÔLE
 *   Vérifie les données envoyées pour faire avancer une réserve : changer
 *   son statut (Ouverte -> En cours -> Clôturée) et, pour la lever, joindre
 *   la preuve de correction (justificatif) et la date de levée.
 *
 * LÉGENDE DES RÈGLES
 *   sometimes = vérifié seulement s'il est envoyé
 *   nullable  = peut rester vide
 * ============================================================================
 */
class UpdateReserveEnginRequest extends FormRequest
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
            'statut' => 'sometimes|in:Ouverte,En cours,Clôturée',
            // Justificatif de levée : PDF ou image, 10 Mo maximum.
            'justificatif_levee' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'date_levee_effective' => 'nullable|date',
        ];
    }
}
