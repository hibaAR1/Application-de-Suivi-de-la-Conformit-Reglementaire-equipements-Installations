<?php

namespace App\Modules\TypeEquipement\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TypeEquipementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_type_equipement' => $this->id_type_equipement,
            'libelle' => $this->libelle,
            'categorie' => $this->categorie,
            'periodicite_controle' => $this->periodicite_controle,
            'caracteristiques_definition' => $this->caracteristiques_definition,
        ];
    }
}
