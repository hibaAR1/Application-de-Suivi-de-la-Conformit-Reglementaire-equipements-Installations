<?php

namespace App\Http\Resources;

use App\Http\Resources\ReserveEnginResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/*
 * ============================================================================
 * RESSOURCE API : ControleEnginResource
 * ============================================================================
 *
 * RÔLE
 *   Définit le JSON renvoyé au frontend pour UN contrôle d'engin : quelles
 *   colonnes du modèle ControleEngin sont exposées, et sous quel nom.
 *
 * RELATION INCLUSE
 *   - reserves : les réserves du contrôle, ajoutées au JSON seulement si la
 *     relation a été chargée par le contrôleur (whenLoaded). Sinon la clé
 *     est omise.
 * ============================================================================
 */
class ControleEnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // --- Identifiants ---
            'id_controle_engin' => $this->id_controle_engin,
            'id_engin' => $this->id_engin,

            // --- Contenu du contrôle ---
            'date_controle' => $this->date_controle,
            'organisme_controle' => $this->organisme_controle,
            'resultat_global' => $this->resultat_global,
            'rapport_controle' => $this->rapport_controle,
            'prochaine_echeance' => $this->prochaine_echeance,
            'id_utilisateur_auteur' => $this->id_utilisateur_auteur,

            // --- Relation ---
            'reserves' => ReserveEnginResource::collection($this->whenLoaded('reserves')),
        ];
    }
}
