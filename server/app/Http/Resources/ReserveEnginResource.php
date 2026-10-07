<?php

namespace App\Http\Resources;

use App\Http\Resources\ControleEnginResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReserveEnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_reserve_engin' => $this->id_reserve_engin,
            'id_controle_engin' => $this->id_controle_engin,
            'nature_reserve' => $this->nature_reserve,
            'niveau_criticite' => $this->niveau_criticite,
            'responsable' => $this->responsable,
            'action_corrective' => $this->action_corrective,
            'delai_levee' => $this->delai_levee,
            'statut' => $this->statut,
            'justificatif_levee' => $this->justificatif_levee,
            'date_levee_effective' => $this->date_levee_effective,
            'controle' => ControleEnginResource::make($this->whenLoaded('controle')),
        ];
    }
}
