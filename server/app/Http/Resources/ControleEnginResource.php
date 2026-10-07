<?php

namespace App\Http\Resources;

use App\Http\Resources\ReserveEnginResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ControleEnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_controle_engin' => $this->id_controle_engin,
            'id_engin' => $this->id_engin,
            'date_controle' => $this->date_controle,
            'organisme_controle' => $this->organisme_controle,
            'resultat_global' => $this->resultat_global,
            'rapport_controle' => $this->rapport_controle,
            'prochaine_echeance' => $this->prochaine_echeance,
            'id_utilisateur_auteur' => $this->id_utilisateur_auteur,
            'reserves' => ReserveEnginResource::collection($this->whenLoaded('reserves')),
        ];
    }
}
