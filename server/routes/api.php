<?php

use App\Modules\Assistant\AssistantController;
use App\Modules\Auth\AuthController;
use App\Modules\Bootstrap\BootstrapController;
use App\Modules\Controle\ControleController;
use App\Modules\Equipement\EquipementController;
use App\Modules\Filiale\FilialeController;
use App\Modules\GroupeEquipement\GroupeEquipementController;
use App\Modules\Permission\PermissionController;
use App\Modules\Rapport\RapportController;
use App\Modules\Reserve\ReserveController;
use App\Modules\Role\RoleController;
use App\Modules\Site\SiteController;
use App\Modules\TypeEquipement\TypeEquipementController;
use App\Modules\Utilisateur\UtilisateurController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/changer-mot-de-passe', [AuthController::class, 'changerMotDePasse']);

    Route::get('/donnees-initiales', [BootstrapController::class, 'index']);

    // Chaque ->middlewareFor(...) ci-dessous vérifie CÔTÉ SERVEUR la
    // permission exacte, en plus du masquage déjà fait côté écran (voir
    // Sidebar.jsx / EquipementsListe.jsx / hasPermission(...)) — un appel
    // direct à l'API sans passer par un bouton est maintenant bloqué aussi.
    Route::apiResource('equipements', EquipementController::class)
        ->middlewareFor(['index', 'show'], 'permission:equipements.view')
        ->middlewareFor('store', 'permission:equipements.create')
        ->middlewareFor('update', 'permission:equipements.edit')
        ->middlewareFor('destroy', 'permission:equipements.delete');

    Route::apiResource('filiales', FilialeController::class);

    // Gestion des rôles/permissions : réservée aux mêmes comptes que la
    // page Utilisateurs (voir RolesAdmin.jsx / Utilisateurs.jsx).
    Route::apiResource('roles', RoleController::class)
        ->middleware('permission:utilisateurs.manage');
    Route::apiResource('utilisateurs', UtilisateurController::class)
        ->middleware('permission:utilisateurs.manage');

    Route::apiResource('reserves', ReserveController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middlewareFor(['store', 'update'], 'permission:reserves.lever');

    Route::apiResource('controles', ControleController::class)
        ->only(['index', 'show', 'store'])
        ->middlewareFor('store', 'permission:controles.create');

    Route::apiResource('permissions', PermissionController::class)
        ->only(['index', 'store'])
        ->middleware('permission:utilisateurs.manage');

    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store'])
        ->middleware('permission:equipements.create');

    Route::get('/type-equipements', [TypeEquipementController::class, 'index']);
    Route::post('/type-equipements', [TypeEquipementController::class, 'store'])
        ->middleware('permission:utilisateurs.manage|equipements.create');
    Route::put('/type-equipements/{id}', [TypeEquipementController::class, 'update'])
        ->middleware('permission:utilisateurs.manage|equipements.create');
    Route::delete('/type-equipements/{id}', [TypeEquipementController::class, 'destroy'])
        ->middleware('permission:utilisateurs.manage|equipements.create');

    // Page "Données de base > Groupes" (Administration)
    Route::apiResource('groupes-equipement', GroupeEquipementController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middlewareFor(['store', 'update', 'destroy'], 'permission:utilisateurs.manage|equipements.create');

    Route::get('/equipements/{id}/rapports', [RapportController::class, 'index']);
    Route::post('/equipements/{id}/rapports', [RapportController::class, 'store'])
        ->middleware('permission:equipements.edit');

    Route::post('/equipements/{id}/assistant/plan-action', [AssistantController::class, 'planAction']);
    Route::post('/equipements/{id}/assistant/points-controle', [AssistantController::class, 'pointsControle']);

    Route::post('/assistant', [AssistantController::class, 'poser']);
});
