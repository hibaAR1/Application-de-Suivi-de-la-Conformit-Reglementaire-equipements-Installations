<?php

namespace App\Modules\Rapport\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRapportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'date_rapport' => 'required|date',
            'organisme' => 'required|string|max:150',
            'reference' => 'nullable|string|max:100',
            'constatations' => 'nullable|string',
            'fichier' => 'nullable|file|mimes:pdf|max:10240',
        ];
    }
}
