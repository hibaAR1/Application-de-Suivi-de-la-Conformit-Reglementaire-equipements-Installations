<?php

use App\Http\Controllers\AssistantController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BootstrapController;
use App\Http\Controllers\ControleController;
use App\Http\Controllers\ControleEnginController;
use App\Http\Controllers\EnginController;
use App\Http\Controllers\EquipementController;
use App\Http\Controllers\FilialeController;
use App\Http\Controllers\GroupeEquipementController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RapportController;
use App\Http\Controllers\RapportEnginController;
use App\Http\Controllers\ReserveController;
use App\Http\Controllers\ReserveEnginController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\TypeEquipementController;
use App\Http\Controllers\UtilisateurController;
use Illuminate\Support\Facades\Route;

/*
 * ============================================================================
 * ROUTES DE L'API  (toutes préfixées par /api)
 * ============================================================================
 *
 * ORGANISATION
 *   1. Route publique : connexion
 *   2. Routes protégées (jeton Sanctum obligatoire), par thème :
 *      authentification, données initiales, équipements, engins, filiales,
 *      rôles et utilisateurs, réserves, contrôles, permissions, sites,
 *      types, groupes, rapports, assistant IA
 *
 * PERMISSIONS
 *   Chaque ->middlewareFor(...) / ->middleware(...) vérifie CÔTÉ SERVEUR la
 *   permission exacte. Elle s'ajoute au masquage fait côté écran (boutons,
 *   menus) : un appel direct à l'API sans passer par un bouton est donc
 *   bloqué aussi. Le signe "|" signifie « l'une OU l'autre permission ».
 * ============================================================================
 */

// --- Route publique ---
Route::post('/login', [AuthController::class, 'login']);

// --- Routes protégées : l'utilisateur doit être connecté ---
Route::middleware('auth:sanctum')->group(function () {
    // Session de l'utilisateur connecté
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/changer-mot-de-passe', [AuthController::class, 'changerMotDePasse']);

    // Toutes les données chargées à l'ouverture de l'application, en une
    // seule requête.
    Route::get('/donnees-initiales', [BootstrapController::class, 'index']);

    // --- Équipements ---
    Route::apiResource('equipements', EquipementController::class)
        ->middlewareFor(['index', 'show'], 'permission:equipements.view')
        ->middlewareFor('store', 'permission:equipements.create')
        ->middlewareFor('update', 'permission:equipements.edit')
        ->middlewareFor('destroy', 'permission:equipements.delete');

    // --- Engins ---
    // Tables séparées de "equipement" (engin, controle_engin, reserve_engin,
    // rapport_engin). Ils réutilisent les mêmes permissions que les
    // équipements : il n'y a pas de permissions dédiées aux engins.
    Route::apiResource('engins', EnginController::class)
        ->middlewareFor(['index', 'show'], 'permission:equipements.view')
        ->middlewareFor('store', 'permission:equipements.create')
        ->middlewareFor('update', 'permission:equipements.edit')
        ->middlewareFor('destroy', 'permission:equipements.delete');

    // --- Filiales ---
    Route::apiResource('filiales', FilialeController::class);

    // --- Rôles et utilisateurs ---
    // Réservés aux comptes qui gèrent les utilisateurs (permission
    // "utilisateurs.manage").
    Route::apiResource('roles', RoleController::class)
        ->middleware('permission:utilisateurs.manage');
    Route::apiResource('utilisateurs', UtilisateurController::class)
        ->middleware('permission:utilisateurs.manage');

    // --- Réserves et contrôles des équipements ---
    Route::apiResource('reserves', ReserveController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middlewareFor(['store', 'update'], 'permission:reserves.lever');

    Route::apiResource('controles', ControleController::class)
        ->only(['index', 'show', 'store'])
        ->middlewareFor('store', 'permission:controles.create');

    // --- Réserves et contrôles des engins (mêmes permissions) ---
    Route::apiResource('reserves-engin', ReserveEnginController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middlewareFor(['store', 'update'], 'permission:reserves.lever');

    Route::apiResource('controles-engin', ControleEnginController::class)
        ->only(['index', 'show', 'store'])
        ->middlewareFor('store', 'permission:controles.create');

    // --- Permissions ---
    Route::apiResource('permissions', PermissionController::class)
        ->only(['index', 'store'])
        ->middleware('permission:utilisateurs.manage');

    // --- Sites ---
    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store'])
        ->middleware('permission:equipements.create');

    // --- Types d'équipement (utilisés aussi par les engins) ---
    Route::get('/type-equipements', [TypeEquipementController::class, 'index']);
    Route::post('/type-equipements', [TypeEquipementController::class, 'store'])
        ->middleware('permission:utilisateurs.manage|equipements.create');
    Route::put('/type-equipements/{id}', [TypeEquipementController::class, 'update'])
        ->middleware('permission:utilisateurs.manage|equipements.create');
    Route::delete('/type-equipements/{id}', [TypeEquipementController::class, 'destroy'])
        ->middleware('permission:utilisateurs.manage|equipements.create');

    // --- Groupes d'équipement ---
    // Page "Données de base > Groupes" (Administration).
    Route::apiResource('groupes-equipement', GroupeEquipementController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middlewareFor(['store', 'update', 'destroy'], 'permission:utilisateurs.manage|equipements.create');

    // --- Rapports PDF (équipements puis engins) ---
    Route::get('/equipements/{id}/rapports', [RapportController::class, 'index']);
    Route::post('/equipements/{id}/rapports', [RapportController::class, 'store'])
        ->middleware('permission:equipements.edit');

    Route::get('/engins/{id}/rapports', [RapportEnginController::class, 'index']);
    Route::post('/engins/{id}/rapports', [RapportEnginController::class, 'store'])
        ->middleware('permission:equipements.edit');

    // --- Assistant IA (équipements, engins, puis question libre) ---
    Route::post('/equipements/{id}/assistant/plan-action', [AssistantController::class, 'planAction']);
    Route::post('/equipements/{id}/assistant/points-controle', [AssistantController::class, 'pointsControle']);
    Route::post('/engins/{id}/assistant/plan-action', [AssistantController::class, 'planActionEngin']);
    Route::post('/engins/{id}/assistant/points-controle', [AssistantController::class, 'pointsControleEngin']);
    Route::post('/assistant', [AssistantController::class, 'poser']);
});
