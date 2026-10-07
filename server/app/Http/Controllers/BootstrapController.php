<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Engin;
use App\Models\Equipement;
use App\Http\Resources\EnginResource;
use App\Http\Resources\EquipementResource;
use App\Models\Filiale;
use App\Http\Resources\FilialeResource;
use App\Models\GroupeEquipement;
use App\Http\Resources\GroupeEquipementResource;
use App\Http\Resources\SiteResource;
use App\Models\Site;
use App\Http\Resources\TypeEquipementResource;
use App\Models\TypeEquipement;

class BootstrapController extends Controller
{
    // Regroupe en une seule requête HTTP toutes les données chargées à
    // l'ouverture de l'application (équipements, engins, filiales, sites, types,
    // groupes), au lieu de requêtes séparées.
    //
    // (La lenteur observée pendant le diagnostic venait en réalité du
    // throttling "3G" resté activé dans l'onglet Network de Chrome DevTools
    // — pas du serveur. Le bloc de mesure temporaire a été retiré.)
    public function index()
    {
        return [
            'equipements' => EquipementResource::collection(
                Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves'])->get()
            ),
            // Engins (table "engin" séparée), avec leurs contrôles et réserves.
            'engins' => EnginResource::collection(
                Engin::with(['filiale', 'site', 'typeEquipement', 'controles.reserves'])->get()
            ),
            'filiales' => FilialeResource::collection(Filiale::all()),
            'sites' => SiteResource::collection(Site::orderBy('libelle')->get()),
            'typesEquipement' => TypeEquipementResource::collection(TypeEquipement::orderBy('libelle')->get()),
            'groupesEquipement' => GroupeEquipementResource::collection(GroupeEquipement::orderBy('libelle')->get()),
        ];
    }
}
