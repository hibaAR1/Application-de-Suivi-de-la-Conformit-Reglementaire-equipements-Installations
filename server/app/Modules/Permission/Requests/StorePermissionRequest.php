<?php

namespace App\Modules\Permission\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            // ex: "rapports.export" — convention "module.action" du reste de
            // l'appli (voir PermissionSeeder.php), mais pas imposée strictement
            // pour ne pas bloquer une admin qui tape autre chose.
            'code' => 'required|string|max:150|unique:permission,code',
            'libelle' => 'required|string|max:255',
        ];
    }
}
