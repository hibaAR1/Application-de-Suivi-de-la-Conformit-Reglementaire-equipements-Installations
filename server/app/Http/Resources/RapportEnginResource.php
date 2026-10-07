<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/*
 * ============================================================================
 * RESSOURCE API : RapportEnginResource
 * ============================================================================
 *
 * RÔLE
 *   Définit le JSON renvoyé au frontend pour UN rapport d'engin : quelles
 *   colonnes du modèle RapportEngin sont exposées, et sous quel nom.
 * ============================================================================
 */
class RapportEnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // --- Identifiants ---
            'id_rapport_engin' => $this->id_rapport_engin,
            'id_engin' => $this->id_engin,

            // --- Contenu du rapport ---
            'date_rapport' => $this->date_rapport,
            'organisme' => $this->organisme,
            'reference' => $this->reference,
            'chemin_pdf' => $this->chemin_pdf,
            'constatations' => $this->constatations,
            'date_creation' => $this->date_creation,
        ];
    }
}
