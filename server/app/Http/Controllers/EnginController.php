<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEnginRequest;
use App\Http\Requests\UpdateEnginRequest;
use App\Http\Resources\EnginResource;
use App\Models\Engin;
use App\Models\Filiale;
use App\Models\Site;
use App\Models\TypeEquipement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Engins (matériel mobile) : table "engin", séparée de "equipement". Même
// logique que EquipementController.
class EnginController extends Controller
{
    public function index(Request $request)
    {
        $query = Engin::with(['filiale', 'site', 'typeEquipement', 'controles.reserves']);

        if ($request->has('id_filiale')) {
            $query->where('id_filiale', $request->id_filiale);
        }

        // Les plus récemment créés en premier.
        return EnginResource::collection($query->orderByDesc('created_at')->get());
    }

    public function show($id)
    {
        $engin = Engin::with(['filiale', 'site', 'typeEquipement', 'controles.reserves', 'rapports'])->findOrFail($id);

        return new EnginResource($engin);
    }

    public function store(StoreEnginRequest $request)
    {
        $data = $request->validated();

        $data['statut'] = $data['statut'] ?? 'Conforme';

        $filiale = Filiale::findOrFail($data['id_filiale']);
        $typeEquipement = TypeEquipement::findOrFail($data['id_type_equipement']);
        $site = $data['id_site'] ? Site::find($data['id_site']) : null;

        // Même format d'identifiant que les équipements : [FILIALE]-[SITE]-[TYPE]-[SEQ],
        // ex. "CTM-105-GRUE-01". "SS" (sans site) si aucun site choisi.
        $codeSite = $site->code ?? 'SS';
        $codeType = $this->codeType($typeEquipement->libelle);
        $prefixe = "{$filiale->code}-{$codeSite}-{$codeType}-";
        $compteDepart = Engin::where('id_engin', 'like', "{$prefixe}%")->count();

        // Essaie plusieurs identifiants consécutifs au cas où un autre engin
        // aurait été créé entre-temps (concurrence).
        for ($tentative = 1; $tentative <= 20; $tentative++) {
            $idCandidat = $prefixe . sprintf('%02d', $compteDepart + $tentative);
            if (Engin::where('id_engin', $idCandidat)->exists()) {
                continue;
            }

            $data['id_engin'] = $idCandidat;
            $data['referentiel'] = $idCandidat;

            try {
                return new EnginResource(Engin::create($data)->load(['filiale', 'site', 'typeEquipement']));
            } catch (\Illuminate\Database\QueryException $e) {
                continue; // collision concurrente sur cet id précis : on retente le suivant
            }
        }

        abort(500, "Impossible de générer un identifiant d'engin unique, réessayez.");
    }

    // "GRUE" pour "Grue"... 4 lettres, sans accents ni espaces, pour le
    // segment [TYPE] de l'identifiant.
    private function codeType(string $libelle): string
    {
        $sansAccents = Str::ascii($libelle);
        $lettres = strtoupper(preg_replace('/[^A-Za-z]/', '', $sansAccents));

        return substr(str_pad($lettres, 4, 'X'), 0, 4);
    }

    public function update(UpdateEnginRequest $request, $id)
    {
        $engin = Engin::findOrFail($id);

        $data = $request->validated();

        $engin->update($data);

        return new EnginResource($engin->load(['filiale', 'site', 'typeEquipement']));
    }

    public function destroy($id)
    {
        $engin = Engin::findOrFail($id);

        DB::transaction(function () use ($engin) {
            // fk_controle_engin_engin n'a pas de "on delete cascade" (comme pour
            // les équipements, pour ne jamais perdre un historique de contrôle par
            // accident) : on supprime donc les contrôles explicitement avant
            // l'engin. Leurs réserves cascadent depuis "controle_engin" et les
            // rapports cascadent depuis "engin".
            $engin->controles()->delete();
            $engin->delete();
        });

        return response()->json(['message' => 'Engin supprimé.']);
    }
}
