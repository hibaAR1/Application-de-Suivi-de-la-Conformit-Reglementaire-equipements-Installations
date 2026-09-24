<?php

namespace App\Modules\Rapport\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RapportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_rapport' => $this->id_rapport,
            'id_equipement' => $this->id_equipement,
            'date_rapport' => $this->date_rapport,
            'organisme' => $this->organisme,
            'reference' => $this->reference,
            'chemin_pdf' => $this->chemin_pdf,
            'constatations' => $this->constatations,
            'date_creation' => $this->date_creation,
        ];
    }
}
