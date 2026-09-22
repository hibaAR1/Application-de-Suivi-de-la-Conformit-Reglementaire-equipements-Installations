<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reserve;
use Illuminate\Http\Request;

class ReserveController extends Controller
{
    public function index()
    {
        return Reserve::with('controle')->get();
    }

    public function show($id)
    {
        return Reserve::with('controle')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_controle' => 'required|integer|exists:controle,id_controle',
            'nature_reserve' => 'required|string',
            'niveau_criticite' => 'required|in:Mineure,Majeure,Bloquante',
            'delai_levee' => 'nullable|date',
        ]);

        // §3.2 du CDC : une réserve nouvellement créée démarre toujours "Ouverte".
        $data['statut'] = 'Ouverte';

        return Reserve::create($data);
    }

    public function update(Request $request, $id)
{
    $reserve = Reserve::findOrFail($id);

    $data = $request->validate([
        'statut' => 'sometimes|in:Ouverte,En cours,Levée,En retard',
        'justificatif_levee' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // PDF/image, 10 Mo max
        'date_levee_effective' => 'nullable|date',
    ]);

    // Si un fichier justificatif a été envoyé, on le stocke et on ne garde que son chemin
    if ($request->hasFile('justificatif_levee')) {
        $data['justificatif_levee'] = $request->file('justificatif_levee')->store('justificatifs', 'local');
    }

    $reserve->update($data);
    return $reserve;
}
}
