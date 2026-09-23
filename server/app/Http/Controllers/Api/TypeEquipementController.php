<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeEquipement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TypeEquipementController extends Controller
{
    public function index()
    {
        return TypeEquipement::orderBy('libelle')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'libelle' => 'required|string|max:150|unique:type_equipement,libelle',
            'categorie' => 'required|string|max:50',
            'periodicite_controle' => 'required|integer|min:1',
            'caracteristiques' => 'nullable|array',
            'caracteristiques.*' => 'string|max:100',
        ]);

        $definition = collect($data['caracteristiques'] ?? [])
            ->filter(fn ($libelle) => trim($libelle) !== '')
            ->map(fn ($libelle) => [
                'cle' => Str::slug($libelle, '_'),
                'libelle' => $libelle,
            ])
            ->values()
            ->all();

        $type = TypeEquipement::create([
            'libelle' => $data['libelle'],
            'categorie' => $data['categorie'],
            'periodicite_controle' => $data['periodicite_controle'],
            'caracteristiques_definition' => $definition,
        ]);

        return response()->json($type, 201);
    }
}
