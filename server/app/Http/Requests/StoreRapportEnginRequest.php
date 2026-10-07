<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/*
 * ============================================================================
 * VALIDATION : ajout d'un rapport sur un engin  (POST /api/engins/{id}/rapports)
 * ============================================================================
 *
 * RÔLE
 *   Vérifie les données du formulaire "Ajouter un rapport" : les
 *   informations du rapport et, si fourni, le fichier PDF.
 *   L'engin concerné vient de l'URL, pas du formulaire.
 *
 * LÉGENDE DES RÈGLES
 *   required = obligatoire     nullable = peut rester vide
 * ============================================================================
 */
class StoreRapportEnginRequest extends FormRequest
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
            'date_rapport' => 'required|date',
            'organisme' => 'required|string|max:150',
            'reference' => 'nullable|string|max:100',
            'constatations' => 'nullable|string',
            // Fichier du rapport : PDF uniquement, 10 Mo maximum.
            'fichier' => 'nullable|file|mimes:pdf|max:10240',
        ];
    }
}
