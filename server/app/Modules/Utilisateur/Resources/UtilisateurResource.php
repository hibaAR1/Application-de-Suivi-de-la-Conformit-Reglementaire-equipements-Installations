<?php

namespace App\Modules\Utilisateur\Resources;

use App\Modules\Filiale\Resources\FilialeResource;
use App\Modules\Role\Resources\RoleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// mot_de_passe n'apparaît jamais ici (déjà caché via $hidden sur le modèle,
// et de toute façon absent de la liste de champs ci-dessous).
class UtilisateurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_utilisateur' => $this->id_utilisateur,
            'nom' => $this->nom,
            'email' => $this->email,
            'id_filiale' => $this->id_filiale,
            'id_role' => $this->id_role,
            'actif' => $this->actif,
            'doit_changer_mot_passe' => $this->doit_changer_mot_passe,
            'role' => RoleResource::make($this->whenLoaded('role')),
            'filiale' => FilialeResource::make($this->whenLoaded('filiale')),
            'filiales' => FilialeResource::collection($this->whenLoaded('filiales')),
        ];
    }
}
