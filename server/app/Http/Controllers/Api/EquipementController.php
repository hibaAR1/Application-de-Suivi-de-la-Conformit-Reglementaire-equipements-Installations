<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EquipementController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves']);

        if ($request->has('id_filiale')) {
            $query->where('id_filiale', $request->id_filiale);
        }

        return $query->get();
    }

    public function show($id)
    {
        return Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves', 'rapports'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_equipement' => 'required|string|unique:equipement',
            'referentiel' => 'required|string|unique:equipement',
            'id_filiale' => 'required|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'required|integer',
            'designation' => 'required|string|max:100',
            'marque_modele' => 'nullable|string',
            'numero_serie' => 'required|string|unique:equipement',
            'date_mise_en_service' => 'required|date',
           'statut' => 'nullable|in:Conforme,Conforme avec réserve,Non conforme',

            'qr_code' => 'nullable|string',
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            'caracteristiques' => 'nullable|array',
        ]);

        $data['statut'] = $data['statut'] ?? 'Conforme';

        return Equipement::create($data)->load(['filiale', 'site', 'typeEquipement']);
    }

    public function update(Request $request, $id)
    {
        $equipement = Equipement::findOrFail($id);

        $data = $request->validate([
            'id_filiale' => 'sometimes|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'sometimes|integer',
            'designation' => 'sometimes|string|max:100',
            'marque_modele' => 'nullable|string',
            'numero_serie' => ['sometimes', 'string', Rule::unique('equipement')->ignore($id, 'id_equipement')],
            'date_mise_en_service' => 'sometimes|date',
            'statut' => 'sometimes|in:Conforme,Conforme avec réserve,Non conforme',
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            'caracteristiques' => 'nullable|array',
        ]);

        $equipement->update($data);

        return $equipement->load(['filiale', 'site', 'typeEquipement']);
    }
}
