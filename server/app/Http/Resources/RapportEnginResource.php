<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RapportEnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_rapport_engin' => $this->id_rapport_engin,
            'id_engin' => $this->id_engin,
            'date_rapport' => $this->date_rapport,
            'organisme' => $this->organisme,
            'reference' => $this->reference,
            'chemin_pdf' => $this->chemin_pdf,
            'constatations' => $this->constatations,
            'date_creation' => $this->date_creation,
        ];
    }
}
