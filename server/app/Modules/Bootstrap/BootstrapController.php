<?php

namespace App\Modules\Bootstrap;

use App\Http\Controllers\Controller;
use App\Modules\Equipement\Equipement;
use App\Modules\Equipement\Resources\EquipementResource;
use App\Modules\Filiale\Filiale;
use App\Modules\Filiale\Resources\FilialeResource;
use App\Modules\GroupeEquipement\GroupeEquipement;
use App\Modules\GroupeEquipement\Resources\GroupeEquipementResource;
use App\Modules\Site\Resources\SiteResource;
use App\Modules\Site\Site;
use App\Modules\TypeEquipement\Resources\TypeEquipementResource;
use App\Modules\TypeEquipement\TypeEquipement;

class BootstrapController extends Controller
{
    // Regroupe en une seule requête HTTP toutes les données chargées à
    // l'ouverture de l'application (équipements, filiales, sites, types,
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
            'filiales' => FilialeResource::collection(Filiale::all()),
            'sites' => SiteResource::collection(Site::orderBy('libelle')->get()),
            'typesEquipement' => TypeEquipementResource::collection(TypeEquipement::orderBy('libelle')->get()),
            'groupesEquipement' => GroupeEquipementResource::collection(GroupeEquipement::orderBy('libelle')->get()),
        ];
    }
}
