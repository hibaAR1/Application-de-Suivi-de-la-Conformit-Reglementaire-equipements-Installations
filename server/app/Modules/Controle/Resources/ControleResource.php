<?php

namespace App\Modules\Controle\Resources;

use App\Modules\Reserve\Resources\ReserveResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ControleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_controle' => $this->id_controle,
            'id_equipement' => $this->id_equipement,
            'date_controle' => $this->date_controle,
            'organisme_controle' => $this->organisme_controle,
            'resultat_global' => $this->resultat_global,
            'rapport_controle' => $this->rapport_controle,
            'prochaine_echeance' => $this->prochaine_echeance,
            'id_utilisateur_auteur' => $this->id_utilisateur_auteur,
            'reserves' => ReserveResource::collection($this->whenLoaded('reserves')),
        ];
    }
}
