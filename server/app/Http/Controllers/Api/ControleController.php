<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Controle;
use App\Models\Equipement;
use Illuminate\Http\Request;

class ControleController extends Controller
{
    public function index(Request $request)
    {
        $query = Controle::with('reserves');

        if ($request->has('id_equipement')) {
            $query->where('id_equipement', $request->id_equipement);
        }

        return $query->orderByDesc('date_controle')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_equipement' => 'required|string|exists:equipement,id_equipement',
            'date_controle' => 'required|date',
            'organisme_controle' => 'required|string',
            'resultat_global' => 'required|in:Favorable,Favorable avec réserves,Défavorable',
            'rapport_controle' => 'nullable|string',
            'periodicite_mois' => 'required|integer|min:1', // ⚠️ voir note ci-dessous
        ]);

        // §3.2 : "Prochaine échéance = Date contrôle + périodicité réglementaire" (calculé, pas saisi)
        $prochaineEcheance = \Carbon\Carbon::parse($data['date_controle'])
            ->addMonths($data['periodicite_mois'])
            ->toDateString();

        $controle = Controle::create([
            'id_equipement' => $data['id_equipement'],
            'date_controle' => $data['date_controle'],
            'organisme_controle' => $data['organisme_controle'],
            'resultat_global' => $data['resultat_global'],
            'rapport_controle' => $data['rapport_controle'] ?? null,
            'prochaine_echeance' => $prochaineEcheance,
            'id_utilisateur_auteur' => $request->user()->id_utilisateur,
        ]);

        return $controle->load('reserves');
    }
}
