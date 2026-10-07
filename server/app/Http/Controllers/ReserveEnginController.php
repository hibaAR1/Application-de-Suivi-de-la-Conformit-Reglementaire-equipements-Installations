<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReserveEnginRequest;
use App\Http\Requests\UpdateReserveEnginRequest;
use App\Http\Resources\ReserveEnginResource;
use App\Models\ReserveEngin;

// Réserves des ENGINS (table "reserve_engin") : même logique que
// ReserveController pour les équipements.
class ReserveEnginController extends Controller
{
    public function index()
    {
        return ReserveEnginResource::collection(ReserveEngin::with('controle')->get());
    }

    public function show($id)
    {
        return new ReserveEnginResource(ReserveEngin::with('controle')->findOrFail($id));
    }

    public function store(StoreReserveEnginRequest $request)
    {
        $data = $request->validated();

        // Une réserve nouvellement créée démarre toujours "Ouverte".
        $data['statut'] = 'Ouverte';

        return new ReserveEnginResource(ReserveEngin::create($data));
    }

    public function update(UpdateReserveEnginRequest $request, $id)
    {
        $reserve = ReserveEngin::findOrFail($id);

        $data = $request->validated();

        // Si un fichier justificatif a été envoyé, on le stocke et on ne garde que son chemin
        if ($request->hasFile('justificatif_levee')) {
            $data['justificatif_levee'] = $request->file('justificatif_levee')->store('justificatifs', 'local');
        }

        $reserve->update($data);
        return new ReserveEnginResource($reserve);
    }
}
