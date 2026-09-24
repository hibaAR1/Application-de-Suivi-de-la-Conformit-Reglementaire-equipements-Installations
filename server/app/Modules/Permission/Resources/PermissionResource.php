<?php

namespace App\Modules\Permission\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_permission' => $this->id_permission,
            'code' => $this->code,
            'libelle' => $this->libelle,
        ];
    }
}
