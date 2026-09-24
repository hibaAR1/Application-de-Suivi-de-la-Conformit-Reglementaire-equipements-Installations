<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeEquipement;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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

        $type = TypeEquipement::create([
            'libelle' => $data['libelle'],
            'categorie' => $data['categorie'],
            'periodicite_controle' => $data['periodicite_controle'],
            'caracteristiques_definition' => $this->construireDefinition($data['caracteristiques'] ?? []),
        ]);

        return response()->json($type, 201);
    }

    // Page "Données de base > Types d'équipement" (édition depuis
    // NouveauTypeModal en mode modification).
    public function update(Request $request, $id)
    {
        $type = TypeEquipement::findOrFail($id);

        $data = $request->validate([
            'libelle' => [
                'required', 'string', 'max:150',
                Rule::unique('type_equipement', 'libelle')->ignore($id, 'id_type_equipement'),
            ],
            'categorie' => 'required|string|max:50',
            'periodicite_controle' => 'required|integer|min:1',
            'caracteristiques' => 'nullable|array',
            'caracteristiques.*' => 'string|max:100',
        ]);

        $type->update([
            'libelle' => $data['libelle'],
            'categorie' => $data['categorie'],
            'periodicite_controle' => $data['periodicite_controle'],
            'caracteristiques_definition' => $this->construireDefinition($data['caracteristiques'] ?? []),
        ]);

        return $type;
    }

    public function destroy($id)
    {
        $type = TypeEquipement::findOrFail($id);

        try {
            $type->delete();
        } catch (QueryException $e) {
            // Contrainte de clé étrangère : des équipements utilisent encore ce type.
            abort(422, "Impossible de supprimer : des équipements utilisent encore ce type.");
        }

        return response()->json(['message' => 'Type supprimé.']);
    }

    private function construireDefinition(array $caracteristiques): array
    {
        return collect($caracteristiques)
            ->filter(fn ($libelle) => trim($libelle) !== '')
            ->map(fn ($libelle) => [
                'cle' => Str::slug($libelle, '_'),
                'libelle' => $libelle,
            ])
            ->values()
            ->all();
    }
}
