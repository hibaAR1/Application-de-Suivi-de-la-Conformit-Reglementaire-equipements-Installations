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

/*
 * ============================================================================
 * CONTRÔLEUR : BootstrapController  (route GET /api/donnees-initiales)
 * ============================================================================
 *
 * RÔLE
 *   Regroupe en UNE seule requête HTTP toutes les données chargées à
 *   l'ouverture de l'application, au lieu d'une requête par liste. Le
 *   frontend remplit ensuite ses contextes (équipements, engins, listes de
 *   référence) avec cette réponse.
 *
 * DONNÉES RENVOYÉES
 *   - equipements, engins : avec filiale, site, type, contrôles et réserves
 *   - filiales, sites, typesEquipement, groupesEquipement : listes de
 *     référence utilisées par les filtres et les formulaires
 * ============================================================================
 */
class BootstrapController extends Controller
{
    public function index()
    {
        return [
            // --- Équipements ---
            'equipements' => EquipementResource::collection(
                Equipement::with(['filiale', 'site', 'typeEquipement', 'controles.reserves'])->get()
            ),
            // --- Engins ---
            // Table "engin" séparée de "equipement", avec leurs contrôles et
            // réserves.
            'engins' => EnginResource::collection(
                Engin::with(['filiale', 'site', 'typeEquipement', 'controles.reserves'])->get()
            ),
            // --- Listes de référence (triées par libellé quand c'est utile) ---
            'filiales' => FilialeResource::collection(Filiale::all()),
            'sites' => SiteResource::collection(Site::orderBy('libelle')->get()),
            'typesEquipement' => TypeEquipementResource::collection(TypeEquipement::orderBy('libelle')->get()),
            'groupesEquipement' => GroupeEquipementResource::collection(GroupeEquipement::orderBy('libelle')->get()),
        ];
    }
}
