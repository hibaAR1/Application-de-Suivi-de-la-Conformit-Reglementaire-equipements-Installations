<?php

namespace App\Modules\GroupeEquipement\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupeEquipementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_groupe_equipement' => $this->id_groupe_equipement,
            'libelle' => $this->libelle,
        ];
    }
}
