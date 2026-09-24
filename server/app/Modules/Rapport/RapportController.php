<?php

namespace App\Modules\Rapport;

use App\Http\Controllers\Controller;
use App\Modules\Rapport\Requests\StoreRapportRequest;
use App\Modules\Rapport\Resources\RapportResource;

class RapportController extends Controller
{
    public function index($idEquipement)
    {
        return RapportResource::collection(
            Rapport::where('id_equipement', $idEquipement)
                ->orderByDesc('date_rapport')
                ->get()
        );
    }

    public function store(StoreRapportRequest $request, $idEquipement)
    {
        $data = $request->validated();

        $data['id_equipement'] = $idEquipement;
        $data['date_creation'] = now();

        if ($request->hasFile('fichier')) {
            $data['chemin_pdf'] = $request->file('fichier')->store('rapports', 'public');
        }
        unset($data['fichier']);

        return response()->json(new RapportResource(Rapport::create($data)), 201);
    }
}
