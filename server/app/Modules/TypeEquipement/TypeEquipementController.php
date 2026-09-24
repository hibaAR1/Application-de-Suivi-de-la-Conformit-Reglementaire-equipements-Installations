<?php

namespace App\Modules\TypeEquipement;

use App\Http\Controllers\Controller;
use App\Modules\TypeEquipement\Requests\StoreTypeEquipementRequest;
use App\Modules\TypeEquipement\Requests\UpdateTypeEquipementRequest;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class TypeEquipementController extends Controller
{
    public function index()
    {
        return TypeEquipement::orderBy('libelle')->get();
    }

    public function store(StoreTypeEquipementRequest $request)
    {
        $data = $request->validated();

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
    public function update(UpdateTypeEquipementRequest $request, $id)
    {
        $type = TypeEquipement::findOrFail($id);

        $data = $request->validated();

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
