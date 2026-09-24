<?php

namespace App\Modules\Site\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:50',
            'libelle' => 'required|string|max:150',
            'id_filiale' => 'required|integer',
        ];
    }
}
