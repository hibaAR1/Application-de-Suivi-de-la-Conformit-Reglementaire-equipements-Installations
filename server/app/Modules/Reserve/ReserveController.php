<?php

namespace App\Modules\Reserve;

use App\Http\Controllers\Controller;
use App\Modules\Reserve\Requests\StoreReserveRequest;
use App\Modules\Reserve\Requests\UpdateReserveRequest;

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

    public function store(StoreReserveRequest $request)
    {
        $data = $request->validated();

        // §3.2 du CDC : une réserve nouvellement créée démarre toujours "Ouverte".
        $data['statut'] = 'Ouverte';

        return Reserve::create($data);
    }

    public function update(UpdateReserveRequest $request, $id)
    {
        $reserve = Reserve::findOrFail($id);

        $data = $request->validated();

        // Si un fichier justificatif a été envoyé, on le stocke et on ne garde que son chemin
        if ($request->hasFile('justificatif_levee')) {
            $data['justificatif_levee'] = $request->file('justificatif_levee')->store('justificatifs', 'local');
        }

        $reserve->update($data);
        return $reserve;
    }
}
