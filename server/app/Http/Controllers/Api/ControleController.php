<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Controle;
use App\Models\Equipement;
use App\Models\Reserve;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ControleController extends Controller
{
    // Délai de levée réglementaire (en jours) selon la criticité — à ajuster selon le CDC
    private const DELAI_LEVEE_JOURS = [
        'Mineure' => 90,
        'Majeure' => 30,
        'Bloquante' => 7,
    ];

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
            'rapport' => 'nullable|file|mimes:pdf|max:10240', // PDF, 10 Mo max (CDC 3.2)
            'reserves' => 'nullable|array',
            'reserves.0.nature_reserve' => 'required_if:resultat_global,Favorable avec réserves|string',
            'reserves.0.niveau_criticite' => 'required_if:resultat_global,Favorable avec réserves|in:Mineure,Majeure,Bloquante',
        ]);

        // §3.2 : prochaine échéance = date contrôle + périodicité de l'équipement (calculée côté serveur)
        $equipement = Equipement::findOrFail($data['id_equipement']);
        $prochaineEcheance = Carbon::parse($data['date_controle'])
            ->addMonths((int) $equipement->periodicite_mois)
            ->toDateString();

        $cheminRapport = $request->hasFile('rapport')
            ? $request->file('rapport')->store('rapports', 'local')
            : null;

        $controle = DB::transaction(function () use ($data, $request, $prochaineEcheance, $cheminRapport) {
            $controle = Controle::create([
                'id_equipement' => $data['id_equipement'],
                'date_controle' => $data['date_controle'],
                'organisme_controle' => $data['organisme_controle'],
                'resultat_global' => $data['resultat_global'],
                'rapport_controle' => $cheminRapport,
                'prochaine_echeance' => $prochaineEcheance,
                'id_utilisateur_auteur' => $request->user()->id_utilisateur,
            ]);

            if ($data['resultat_global'] === 'Favorable avec réserves' && isset($data['reserves'][0])) {
                $r = $data['reserves'][0];
                Reserve::create([
                    'id_controle' => $controle->id_controle,
                    'nature_reserve' => $r['nature_reserve'],
                    'niveau_criticite' => $r['niveau_criticite'],
                    'delai_levee' => Carbon::parse($data['date_controle'])
                        ->addDays(self::DELAI_LEVEE_JOURS[$r['niveau_criticite']])
                        ->toDateString(),
                    'statut' => 'Ouverte',
                ]);
            }

            return $controle;
        });

        return $controle->load('reserves');
    }
}