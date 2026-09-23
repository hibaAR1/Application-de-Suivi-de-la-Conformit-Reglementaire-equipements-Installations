<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rapport;
use Illuminate\Http\Request;

class RapportController extends Controller
{
    public function index($idEquipement)
    {
        return Rapport::where('id_equipement', $idEquipement)
            ->orderByDesc('date_rapport')
            ->get();
    }

    public function store(Request $request, $idEquipement)
    {
        $data = $request->validate([
            'date_rapport' => 'required|date',
            'organisme' => 'required|string|max:150',
            'reference' => 'nullable|string|max:100',
            'constatations' => 'nullable|string',
            'fichier' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $data['id_equipement'] = $idEquipement;
        $data['date_creation'] = now();

        if ($request->hasFile('fichier')) {
            $data['chemin_pdf'] = $request->file('fichier')->store('rapports', 'public');
        }
        unset($data['fichier']);

        return response()->json(Rapport::create($data), 201);
    }
}
