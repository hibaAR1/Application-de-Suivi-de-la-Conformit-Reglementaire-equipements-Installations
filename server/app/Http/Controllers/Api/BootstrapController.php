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
    // l'ouverture de l'application (équipements, filiales, sites, types).
    //
    // Avant : le client (EquipementsContext) déclenchait 4 requêtes en
    // parallèle (/equipements, /filiales, /sites, /type-equipements). Côté
    // navigateur elles partent bien en même temps, mais le serveur de dev
    // (`php artisan serve`) ne traite qu'une requête à la fois (pas de
    // vrai multi-thread), et chaque requête ouvre sa propre connexion
    // SQL Server (pas de connexion persistante) — ce qui est lent à établir.
    // Résultat : les 4 requêtes s'empilent au lieu de vraiment être
    // parallèles, d'où les 5-7 secondes de "Chargement..." au premier
    // affichage / après un rafraîchissement de page.
    //
    // En ne faisant plus qu'un seul aller-retour, on ne paie plus qu'une
    // seule fois ce coût de connexion au lieu de quatre.
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
