<?php

namespace App\Modules\Rapport;

use App\Http\Controllers\Controller;
use App\Modules\Rapport\Requests\StoreRapportRequest;

class RapportController extends Controller
{
    public function index($idEquipement)
    {
        return Rapport::where('id_equipement', $idEquipement)
            ->orderByDesc('date_rapport')
            ->get();
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

        return response()->json(Rapport::create($data), 201);
    }
}
