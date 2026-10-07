<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreControleEnginRequest;
use App\Http\Resources\ControleEnginResource;
use App\Models\ControleEngin;
use App\Models\Engin;
use App\Models\ReserveEngin;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Contrôles des ENGINS (table "controle_engin") : même logique que
// ControleController pour les équipements, mais sur les tables des engins.
class ControleEnginController extends Controller
{
    // Délai de levée réglementaire (en jours) selon la criticité — mêmes valeurs
    // que ControleController (équipements).
    private const DELAI_LEVEE_JOURS = [
        'Mineure' => 90,
        'Majeure' => 30,
        'Critique' => 7,
    ];

    public function index(Request $request)
    {
        $query = ControleEngin::with('reserves');

        if ($request->has('id_engin')) {
            $query->where('id_engin', $request->id_engin);
        }

        return ControleEnginResource::collection($query->orderByDesc('date_controle')->get());
    }

    public function store(StoreControleEnginRequest $request)
    {
        $data = $request->validated();

        // Prochaine échéance = date du contrôle + périodicité de l'engin (calculée
        // côté serveur). À défaut : celle de son type, puis 12 mois en dernier
        // recours (jamais 0 : sinon échéance = date du contrôle).
        $engin = Engin::with('typeEquipement')->findOrFail($data['id_engin']);
        $periodicite = $engin->periodicite_mois
            ?? $engin->typeEquipement?->periodicite_controle
            ?? 12;
        $prochaineEcheance = Carbon::parse($data['date_controle'])
            ->addMonths((int) $periodicite)
            ->toDateString();

        $cheminRapport = $request->hasFile('rapport')
            ? $request->file('rapport')->store('rapports', 'local')
            : null;

        $controle = DB::transaction(function () use ($data, $request, $prochaineEcheance, $cheminRapport) {
            $controle = ControleEngin::create([
                'id_engin' => $data['id_engin'],
                'date_controle' => $data['date_controle'],
                'organisme_controle' => $data['organisme_controle'],
                'resultat_global' => $data['resultat_global'],
                'rapport_controle' => $cheminRapport,
                'prochaine_echeance' => $prochaineEcheance,
                'id_utilisateur_auteur' => $request->user()->id_utilisateur,
            ]);

            if ($data['resultat_global'] === 'Favorable avec réserves' && isset($data['reserves'][0])) {
                $r = $data['reserves'][0];
                ReserveEngin::create([
                    'id_controle_engin' => $controle->id_controle_engin,
                    'nature_reserve' => $r['nature_reserve'],
                    'niveau_criticite' => $r['niveau_criticite'],
                    'responsable' => $r['responsable'] ?? null,
                    'action_corrective' => $r['action_corrective'] ?? null,
                    // Échéance : celle choisie dans le formulaire si elle a été
                    // modifiée, sinon calculée depuis la date du contrôle + le
                    // délai réglementaire selon la criticité.
                    'delai_levee' => $r['delai_levee']
                        ?? Carbon::parse($data['date_controle'])
                            ->addDays(self::DELAI_LEVEE_JOURS[$r['niveau_criticite']])
                            ->toDateString(),
                    'statut' => 'Ouverte',
                ]);
            }

            return $controle;
        });

        return new ControleEnginResource($controle->load('reserves'));
    }
}
