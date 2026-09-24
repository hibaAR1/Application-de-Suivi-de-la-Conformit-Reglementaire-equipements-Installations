<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipement;
use App\Models\Filiale;
use App\Models\Site;
use App\Models\TypeEquipement;

class BootstrapController extends Controller
{
    // Regroupe en une seule requête HTTP toutes les données chargées à
    // l'ouverture de l'application (équipements, filiales, sites, types),
    // au lieu des 4 requêtes séparées d'avant.
    //
    // (La lenteur observée pendant le diagnostic venait en réalité du
    // throttling "3G" resté activé dans l'onglet Network de Chrome DevTools
    // — pas du serveur. Le bloc de mesure temporaire a été retiré.)
    public function index()
    {
        return [
            'equipements' => Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves'])->get(),
            'filiales' => Filiale::all(),
            'sites' => Site::orderBy('libelle')->get(),
            'typesEquipement' => TypeEquipement::orderBy('libelle')->get(),
        ];
    }
}
