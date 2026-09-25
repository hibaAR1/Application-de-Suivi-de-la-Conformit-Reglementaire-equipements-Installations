<?php

namespace App\Modules\Role\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'libelle' => 'required|string|max:150|unique:role,libelle',
            'description' => 'nullable|string',
            'id_permissions' => 'nullable|array',
            'id_permissions.*' => 'integer|exists:permission,id_permission',
        ];
    }
}
