<?php

namespace App\Modules\Filiale\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFilialeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'libelle' => 'required|string|max:150',
            'code' => 'required|in:MP,CTM,MT,ML,TCGM|unique:filiale',
        ];
    }
}
