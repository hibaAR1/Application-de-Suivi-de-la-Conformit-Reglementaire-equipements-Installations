<?php

namespace App\Modules\Site\Resources;

use App\Modules\Filiale\Resources\FilialeResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_site' => $this->id_site,
            'code' => $this->code,
            'libelle' => $this->libelle,
            'id_filiale' => $this->id_filiale,
            'filiale' => FilialeResource::make($this->whenLoaded('filiale')),
        ];
    }
}
