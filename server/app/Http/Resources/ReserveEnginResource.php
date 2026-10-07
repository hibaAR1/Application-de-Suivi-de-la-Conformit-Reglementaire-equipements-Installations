<?php

namespace App\Http\Resources;

use App\Http\Resources\ControleEnginResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/*
 * ============================================================================
 * RESSOURCE API : ReserveEnginResource
 * ============================================================================
 *
 * RÔLE
 *   Définit le JSON renvoyé au frontend pour UNE réserve d'engin : quelles
 *   colonnes du modèle ReserveEngin sont exposées, et sous quel nom.
 *
 * RELATION INCLUSE
 *   - controle : le contrôle d'origine de la réserve, ajouté au JSON
 *     seulement si la relation a été chargée par le contrôleur (whenLoaded).
 *     Sinon la clé est omise.
 * ============================================================================
 */
class ReserveEnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // --- Identifiants ---
            'id_reserve_engin' => $this->id_reserve_engin,
            'id_controle_engin' => $this->id_controle_engin,

            // --- Description de la réserve ---
            'nature_reserve' => $this->nature_reserve,
            'niveau_criticite' => $this->niveau_criticite,

            // --- Plan d'action ---
            'responsable' => $this->responsable,
            'action_corrective' => $this->action_corrective,
            'delai_levee' => $this->delai_levee,

            // --- Suivi et clôture ---
            'statut' => $this->statut,
            'justificatif_levee' => $this->justificatif_levee,
            'date_levee_effective' => $this->date_levee_effective,

            // --- Relation ---
            'controle' => ControleEnginResource::make($this->whenLoaded('controle')),
        ];
    }
}
