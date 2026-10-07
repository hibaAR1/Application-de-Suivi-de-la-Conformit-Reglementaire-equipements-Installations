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

/*
 * ============================================================================
 * CONTRÔLEUR : ControleEnginController  (routes /api/controles-engin)
 * ============================================================================
 *
 * RÔLE
 *   Gère les contrôles réglementaires des ENGINS (table "controle_engin") :
 *   liste et enregistrement d'un nouveau contrôle. Même logique que
 *   ControleController pour les équipements, mais sur les tables des engins.
 *
 * ACTIONS
 *   index() : liste des contrôles (filtrable par engin), avec leurs réserves
 *   store() : enregistre un contrôle ; si le résultat est "Favorable avec
 *             réserves", crée aussi la réserve correspondante
 *
 * La validation est faite en amont par StoreControleEnginRequest, et le JSON
 * renvoyé est défini par ControleEnginResource.
 * ============================================================================
 */
class ControleEnginController extends Controller
{
    // Délai de levée réglementaire (en jours) selon la criticité — mêmes valeurs
    // que ControleController (équipements).
    private const DELAI_LEVEE_JOURS = [
        'Mineure' => 90,
        'Majeure' => 30,
        'Critique' => 7,
    ];

    // ------------------------------------------------------------------
    // LISTE des contrôles
    // ------------------------------------------------------------------
    public function index(Request $request)
    {
        $query = ControleEngin::with('reserves');

        // Filtre facultatif : ?id_engin=... (contrôles d'un seul engin).
        if ($request->has('id_engin')) {
            $query->where('id_engin', $request->id_engin);
        }

        // Les contrôles les plus récents en premier.
        return ControleEnginResource::collection($query->orderByDesc('date_controle')->get());
    }

    // ------------------------------------------------------------------
    // ENREGISTREMENT d'un contrôle (et de sa réserve éventuelle)
    // ------------------------------------------------------------------
    public function store(StoreControleEnginRequest $request)
    {
        $data = $request->validated();

        // --- 1. Calcul de la prochaine échéance ---
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

        // --- 2. Enregistrement du rapport PDF (s'il y en a un) ---
        // Seul le chemin du fichier est gardé en base.
        $cheminRapport = $request->hasFile('rapport')
            ? $request->file('rapport')->store('rapports', 'local')
            : null;

        // --- 3. Création du contrôle (et de sa réserve) ---
        // Transaction : si la création de la réserve échoue, le contrôle n'est
        // pas enregistré non plus (tout ou rien).
        $controle = DB::transaction(function () use ($data, $request, $prochaineEcheance, $cheminRapport) {
            $controle = ControleEngin::create([
                'id_engin' => $data['id_engin'],
                'date_controle' => $data['date_controle'],
                'organisme_controle' => $data['organisme_controle'],
                'resultat_global' => $data['resultat_global'],
                'rapport_controle' => $cheminRapport,
                'prochaine_echeance' => $prochaineEcheance,
                // Utilisateur connecté qui enregistre le contrôle.
                'id_utilisateur_auteur' => $request->user()->id_utilisateur,
            ]);

            // Une réserve n'est créée que si le résultat est "Favorable avec
            // réserves" et que le formulaire en contient une.
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
                    // Une réserve nouvellement créée démarre toujours "Ouverte".
                    'statut' => 'Ouverte',
                ]);
            }

            return $controle;
        });

        return new ControleEnginResource($controle->load('reserves'));
    }
}
