<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipement;
use Illuminate\Http\Request;

class EquipementController extends Controller
{
    public function index()
    {
        return Equipement::with('controles')->get();
    }

    public function show($id)
    {
        return Equipement::with('controles.reserves')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_equipement' => 'required|string|unique:equipement',
            'referentiel' => 'required|string|unique:equipement',
            'id_filiale' => 'required|integer',
            'id_type_equipement' => 'required|integer',
            'designation' => 'required|string|max:100',
            'numero_serie' => 'required|string|unique:equipement',
            'date_mise_en_service' => 'required|date',
        ]);

        return Equipement::create($data);
    }
}
