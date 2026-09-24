<?php

namespace App\Modules\Auth\Requests;

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
            'email' => 'required|email',
            'mot_de_passe' => 'required|string',
        ];
    }
}
