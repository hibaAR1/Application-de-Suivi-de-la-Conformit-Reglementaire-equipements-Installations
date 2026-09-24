<?php

namespace App\Modules\Controle;

use App\Http\Controllers\Controller;
use App\Modules\Controle\Requests\StoreControleRequest;
use App\Modules\Equipement\Equipement;
use App\Modules\Reserve\Reserve;
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

    public function store(StoreControleRequest $request)
    {
        $data = $request->validated();

        // §3.2 : prochaine échéance = date contrôle + périodicité de l'équipement (calculée côté serveur)
        // periodicite_mois est saisie sur l'équipement lui-même depuis peu ; on
        // retombe sur celle de son type pour les équipements créés avant, puis
        // sur 12 mois en tout dernier recours (jamais 0 : sinon échéance = date du contrôle).
        $equipement = Equipement::with('typeEquipement')->findOrFail($data['id_equipement']);
        $periodicite = $equipement->periodicite_mois
            ?? $equipement->typeEquipement?->periodicite_controle
            ?? 12;
        $prochaineEcheance = Carbon::parse($data['date_controle'])
            ->addMonths((int) $periodicite)
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
