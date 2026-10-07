<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRapportEnginRequest;
use App\Http\Resources\RapportEnginResource;
use App\Models\RapportEngin;

// Rapports de contrôle (PDF) des ENGINS (table "rapport_engin") : même logique
// que RapportController pour les équipements.
class RapportEnginController extends Controller
{
    public function index($idEngin)
    {
        return RapportEnginResource::collection(
            RapportEngin::where('id_engin', $idEngin)
                ->orderByDesc('date_rapport')
                ->get()
        );
    }

    public function store(StoreRapportEnginRequest $request, $idEngin)
    {
        $data = $request->validated();

        $data['id_engin'] = $idEngin;
        $data['date_creation'] = now();

        if ($request->hasFile('fichier')) {
            $data['chemin_pdf'] = $request->file('fichier')->store('rapports', 'public');
        }
        unset($data['fichier']);

        return response()->json(new RapportEnginResource(RapportEngin::create($data)), 201);
    }
}
