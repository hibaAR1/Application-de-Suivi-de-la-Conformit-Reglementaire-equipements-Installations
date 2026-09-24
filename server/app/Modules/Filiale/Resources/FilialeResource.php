<?php

namespace App\Modules\Filiale\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Formate une Filiale pour la réponse JSON. Ne change rien au contenu déjà
// envoyé au frontend (mêmes champs, mêmes noms) — sert juste d'endroit
// unique pour contrôler plus tard ce qui est exposé par l'API.
class FilialeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_filiale' => $this->id_filiale,
            'libelle' => $this->libelle,
            'code' => $this->code,
        ];
    }
}
