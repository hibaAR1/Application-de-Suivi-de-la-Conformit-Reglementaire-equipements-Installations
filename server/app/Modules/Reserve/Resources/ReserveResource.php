<?php

namespace App\Modules\Reserve\Resources;

use App\Modules\Controle\Resources\ControleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReserveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_reserve' => $this->id_reserve,
            'id_controle' => $this->id_controle,
            'nature_reserve' => $this->nature_reserve,
            'niveau_criticite' => $this->niveau_criticite,
            'delai_levee' => $this->delai_levee,
            'statut' => $this->statut,
            'justificatif_levee' => $this->justificatif_levee,
            'date_levee_effective' => $this->date_levee_effective,
            'controle' => ControleResource::make($this->whenLoaded('controle')),
        ];
    }
}
