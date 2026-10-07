<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRapportEnginRequest;
use App\Http\Resources\RapportEnginResource;
use App\Models\RapportEngin;

/*
 * ============================================================================
 * CONTRÔLEUR : RapportEnginController  (routes /api/engins/{id}/rapports)
 * ============================================================================
 *
 * RÔLE
 *   Gère les rapports de contrôle (fichiers PDF) des ENGINS (table
 *   "rapport_engin"). Même logique que RapportController pour les
 *   équipements.
 *
 * ACTIONS
 *   index() : liste des rapports d'un engin
 *   store() : ajout d'un rapport (avec son PDF) sur un engin
 *
 * L'engin concerné est toujours celui de l'URL ($idEngin). La validation est
 * faite en amont par StoreRapportEnginRequest.
 * ============================================================================
 */
class RapportEnginController extends Controller
{
    // ------------------------------------------------------------------
    // LISTE des rapports d'un engin
    // ------------------------------------------------------------------
    public function index($idEngin)
    {
        return RapportEnginResource::collection(
            RapportEngin::where('id_engin', $idEngin)
                ->orderByDesc('date_rapport')
                ->get()
        );
    }

    // ------------------------------------------------------------------
    // AJOUT d'un rapport
    // ------------------------------------------------------------------
    public function store(StoreRapportEnginRequest $request, $idEngin)
    {
        $data = $request->validated();

        // Données ajoutées par le serveur : l'engin (pris dans l'URL) et la
        // date d'enregistrement.
        $data['id_engin'] = $idEngin;
        $data['date_creation'] = now();

        // Si un PDF a été envoyé, on le stocke et on ne garde que son chemin.
        if ($request->hasFile('fichier')) {
            $data['chemin_pdf'] = $request->file('fichier')->store('rapports', 'public');
        }
        // Le fichier lui-même n'est pas une colonne de la table.
        unset($data['fichier']);

        return response()->json(new RapportEnginResource(RapportEngin::create($data)), 201);
    }
}
