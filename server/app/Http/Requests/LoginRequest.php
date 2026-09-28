<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route publique, pas de permission à vérifier
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string',
            'mot_de_passe' => 'required|string',
        ];
    }
}
