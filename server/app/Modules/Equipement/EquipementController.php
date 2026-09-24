<?php

namespace App\Modules\Equipement;

use App\Http\Controllers\Controller;
use App\Modules\Equipement\Requests\StoreEquipementRequest;
use App\Modules\Equipement\Requests\UpdateEquipementRequest;
use App\Modules\Equipement\Resources\EquipementResource;
use App\Modules\Filiale\Filiale;
use App\Modules\Site\Site;
use App\Modules\TypeEquipement\TypeEquipement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EquipementController extends Controller
{
    public function index(Request $request)
    {
        $query = Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves']);

        if ($request->has('id_filiale')) {
            $query->where('id_filiale', $request->id_filiale);
        }

        return EquipementResource::collection($query->get());
    }

    public function show($id)
    {
        $equipement = Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves', 'rapports'])->findOrFail($id);

        return new EquipementResource($equipement);
    }

    public function store(StoreEquipementRequest $request)
    {
        $data = $request->validated();

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
                return new EquipementResource(Equipement::create($data)->load(['filiale', 'site', 'typeEquipement']));
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

    public function update(UpdateEquipementRequest $request, $id)
    {
        $equipement = Equipement::findOrFail($id);

        $data = $request->validated();

        $equipement->update($data);

        return new EquipementResource($equipement->load(['filiale', 'site', 'typeEquipement']));
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
