<?php

namespace App\Modules\Role\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'libelle' => [
                'required', 'string', 'max:150',
                // La clé primaire de "role" est id_role (pas id) : sans le
                // préciser, ->ignore() cherche une colonne "id" inexistante
                // et n'exclut jamais la ligne courante -> faux "déjà pris".
                Rule::unique('role', 'libelle')->ignore($this->route('role'), 'id_role'),
            ],
            'description' => 'nullable|string',
            'id_permissions' => 'nullable|array',
            'id_permissions.*' => 'integer|exists:permission,id_permission',
        ];
    }
}
