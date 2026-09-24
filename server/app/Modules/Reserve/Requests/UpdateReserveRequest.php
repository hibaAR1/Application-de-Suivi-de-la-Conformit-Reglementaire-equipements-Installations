<?php

namespace App\Modules\Reserve\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReserveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware auth:sanctum sur la route
    }

    public function rules(): array
    {
        return [
            'statut' => 'sometimes|in:Ouverte,En cours,Levée,En retard',
            'justificatif_levee' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // PDF/image, 10 Mo max
            'date_levee_effective' => 'nullable|date',
        ];
    }
}
