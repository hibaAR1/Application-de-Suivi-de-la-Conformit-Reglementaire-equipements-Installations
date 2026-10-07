<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReserveEnginRequest;
use App\Http\Requests\UpdateReserveEnginRequest;
use App\Http\Resources\ReserveEnginResource;
use App\Models\ReserveEngin;

/*
 * ============================================================================
 * CONTRÔLEUR : ReserveEnginController  (routes /api/reserves-engin)
 * ============================================================================
 *
 * RÔLE
 *   Gère les réserves des ENGINS (table "reserve_engin") : une réserve est
 *   un défaut relevé lors d'un contrôle, à corriger avant une échéance.
 *   Même logique que ReserveController pour les équipements.
 *
 * ACTIONS
 *   index()  : liste de toutes les réserves
 *   show()   : une réserve
 *   store()  : ajout d'une réserve sur un contrôle existant
 *   update() : avancement d'une réserve (statut, justificatif, date de levée)
 *
 * La validation est faite en amont par StoreReserveEnginRequest et
 * UpdateReserveEnginRequest, et le JSON renvoyé est défini par
 * ReserveEnginResource.
 * ============================================================================
 */
class ReserveEnginController extends Controller
{
    // ------------------------------------------------------------------
    // LISTE des réserves
    // ------------------------------------------------------------------
    public function index()
    {
        return ReserveEnginResource::collection(ReserveEngin::with('controle')->get());
    }

    // ------------------------------------------------------------------
    // DÉTAIL d'une réserve
    // ------------------------------------------------------------------
    public function show($id)
    {
        return new ReserveEnginResource(ReserveEngin::with('controle')->findOrFail($id));
    }

    // ------------------------------------------------------------------
    // AJOUT d'une réserve
    // ------------------------------------------------------------------
    public function store(StoreReserveEnginRequest $request)
    {
        $data = $request->validated();

        // Une réserve nouvellement créée démarre toujours "Ouverte".
        $data['statut'] = 'Ouverte';

        return new ReserveEnginResource(ReserveEngin::create($data));
    }

    // ------------------------------------------------------------------
    // MISE À JOUR d'une réserve (statut, clôture avec justificatif)
    // ------------------------------------------------------------------
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
