<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipement;
use App\Models\Filiale;
use App\Models\Site;
use App\Models\TypeEquipement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EquipementController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves']);

        if ($request->has('id_filiale')) {
            $query->where('id_filiale', $request->id_filiale);
        }

        return $query->get();
    }

    public function show($id)
    {
        return Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves', 'rapports'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            // id_equipement / referentiel : générés ici côté serveur (voir plus
            // bas), jamais acceptés du client — un identifiant calculé côté
            // React à partir de la liste chargée en mémoire pouvait entrer en
            // collision avec un équipement déjà créé ailleurs (autre onglet,
            // tests successifs, liste locale pas à jour), d'où des erreurs
            // "id equipement has already been taken".
            'id_filiale' => 'required|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'required|integer',
            'designation' => 'required|string|max:100',
            'marque_modele' => 'nullable|string',
            'numero_serie' => 'required|string|unique:equipement',
            'date_mise_en_service' => 'required|date',
            'periodicite_mois' => 'nullable|integer|min:1',
            'statut' => 'nullable|in:Conforme,Conforme avec réserve,Non conforme',

            'qr_code' => 'nullable|string',
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            'caracteristiques' => 'nullable|array',
        ]);

        $data['statut'] = $data['statut'] ?? 'Conforme';

        $filiale = Filiale::findOrFail($data['id_filiale']);
        $typeEquipement = TypeEquipement::findOrFail($data['id_type_equipement']);
        $site = $data['id_site'] ? Site::find($data['id_site']) : null;

        // Nouveau format d'identifiant, pour la saisie manuelle du scan
        // (voir ScannerEquipementModal.jsx) : [FILIALE]-[SITE]-[TYPE]-[SEQ],
        // ex. "CTM-105-CHAR-01". "SS" (sans site) si aucun site choisi —
        // le champ site reste optionnel sur l'équipement.
        $codeSite = $site->code ?? 'SS';
        $codeType = $this->codeType($typeEquipement->libelle);
        $prefixe = "{$filiale->code}-{$codeSite}-{$codeType}-";
        $compteDepart = Equipement::where('id_equipement', 'like', "{$prefixe}%")->count();

        // Essaie plusieurs identifiants consécutifs au cas où un autre
        // équipement aurait été créé entre-temps (concurrence) : on ne
        // s'arrête que sur un id réellement libre.
        for ($tentative = 1; $tentative <= 20; $tentative++) {
            $idCandidat = $prefixe . sprintf('%02d', $compteDepart + $tentative);
            if (Equipement::where('id_equipement', $idCandidat)->exists()) {
                continue;
            }

            $data['id_equipement'] = $idCandidat;
            $data['referentiel'] = $idCandidat;

            try {
                return Equipement::create($data)->load(['filiale', 'site', 'typeEquipement']);
            } catch (\Illuminate\Database\QueryException $e) {
                continue; // collision concurrente sur cet id précis : on retente le suivant
            }
        }

        abort(500, "Impossible de générer un identifiant d'équipement unique, réessayez.");
    }

    // "CHAR" pour "Chariot élévateur", "GRUE" pour "Grue"... 4 lettres,
    // sans accents ni espaces, pour le segment [TYPE] de l'identifiant.
    private function codeType(string $libelle): string
    {
        $sansAccents = Str::ascii($libelle);
        $lettres = strtoupper(preg_replace('/[^A-Za-z]/', '', $sansAccents));

        return substr(str_pad($lettres, 4, 'X'), 0, 4);
    }

    public function update(Request $request, $id)
    {
        $equipement = Equipement::findOrFail($id);

        $data = $request->validate([
            'id_filiale' => 'sometimes|integer',
            'id_site' => 'nullable|integer',
            'id_type_equipement' => 'sometimes|integer',
            'designation' => 'sometimes|string|max:100',
            'marque_modele' => 'nullable|string',
            'numero_serie' => ['sometimes', 'string', Rule::unique('equipement')->ignore($id, 'id_equipement')],
            'date_mise_en_service' => 'sometimes|date',
            'periodicite_mois' => 'nullable|integer|min:1',
            'statut' => 'sometimes|in:Conforme,Conforme avec réserve,Non conforme',
            'immatriculation' => 'nullable|string|max:50',
            'fabricant' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1950|max:2100',
            'organisme_controle' => 'nullable|string|max:150',
            'caracteristiques' => 'nullable|array',
        ]);

        $equipement->update($data);

        return $equipement->load(['filiale', 'site', 'typeEquipement']);
    }

    // Bouton "Supprimer" réservé au super admin dans la liste des
    // équipements (voir EquipementsListe.jsx). apiResource() enregistre
    // bien la route DELETE, mais il fallait encore écrire la méthode.
    public function destroy($id)
    {
        $equipement = Equipement::findOrFail($id);

        DB::transaction(function () use ($equipement) {
            // fk_controle_equipement n'a pas de "on delete cascade" (choix
            // volontaire à la création de cette contrainte, pour ne jamais
            // perdre un historique de contrôle par accident) : on supprime
            // donc les contrôles explicitement avant l'équipement. Leurs
            // réserves cascadent automatiquement depuis "controle"
            // (fk_reserve_controle). Les rapports cascadent et les questions
            // de l'assistant passent à NULL automatiquement depuis
            // "equipement" (fk_rapport_equipement / fk_question_equipement).
            $equipement->controles()->delete();
            $equipement->delete();
        });

        return response()->json(['message' => 'Équipement supprimé.']);
    }
}
