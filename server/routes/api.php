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
    // La création accepte "Créer" OU "Importer" : l'import Excel crée les
    // équipements ligne par ligne (et leur dernier contrôle).
    Route::apiResource('equipements', EquipementController::class)
        ->middlewareFor(['index', 'show'], 'permission:equipements.view')
        ->middlewareFor('store', 'permission:equipements.create|equipements.importer')
        ->middlewareFor('update', 'permission:equipements.edit')
        ->middlewareFor('destroy', 'permission:equipements.delete');

    // Onglets Informations et Caractéristiques de la fiche : permission à part
    // ("Fiche · Informations et Caractéristiques : modifier"), différente du
    // bouton ✎ de la liste (equipements.edit).
    Route::put('/equipements/{equipement}/details', [EquipementController::class, 'update'])
        ->middleware('permission:equipements.fiche_modifier');

    // --- Engins ---
    // Tables séparées de "equipement" (engin, controle_engin, reserve_engin,
    // rapport_engin). Les engins ont leurs propres permissions (engins.*),
    // indépendantes de celles des équipements.
    Route::apiResource('engins', EnginController::class)
        ->middlewareFor('index', 'permission:engins.view|dashboard.filiale.view|dashboard.groupe.view')
        ->middlewareFor('show', 'permission:engins.view')
        ->middlewareFor('store', 'permission:engins.create|engins.importer')
        ->middlewareFor('update', 'permission:engins.edit')
        ->middlewareFor('destroy', 'permission:engins.delete');

    // Onglets Informations et Caractéristiques de la fiche (voir équipements).
    Route::put('/engins/{engin}/details', [EnginController::class, 'update'])
        ->middleware('permission:engins.fiche_modifier');

    // --- Filiales ---
    Route::apiResource('filiales', FilialeController::class);

    // --- Rôles et utilisateurs ---
    // Une permission par action (voir, créer, modifier, supprimer). La liste
    // des rôles reste accessible à qui crée ou modifie un utilisateur (le
    // formulaire en a besoin pour le champ "Rôle").
    Route::apiResource('roles', RoleController::class)
        ->middlewareFor('index', 'permission:roles.view|utilisateurs.create|utilisateurs.edit')
        ->middlewareFor('show', 'permission:roles.view')
        ->middlewareFor('store', 'permission:roles.create')
        ->middlewareFor('update', 'permission:roles.edit')
        ->middlewareFor('destroy', 'permission:roles.delete');
    // Le détail d'un utilisateur (show) sert aussi au formulaire de modification.
    Route::apiResource('utilisateurs', UtilisateurController::class)
        ->middlewareFor('index', 'permission:utilisateurs.view')
        ->middlewareFor('show', 'permission:utilisateurs.view|utilisateurs.edit')
        ->middlewareFor('store', 'permission:utilisateurs.create')
        ->middlewareFor('update', 'permission:utilisateurs.edit')
        ->middlewareFor('destroy', 'permission:utilisateurs.delete');

    // --- Réserves et contrôles des équipements ---
    Route::apiResource('reserves', ReserveController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middlewareFor(['store', 'update'], 'permission:reserves.lever');

    Route::apiResource('controles', ControleController::class)
        ->only(['index', 'show', 'store'])
        ->middlewareFor('store', 'permission:controles.create|equipements.importer');

    // --- Réserves et contrôles des engins (permissions propres aux engins) ---
    Route::apiResource('reserves-engin', ReserveEnginController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middlewareFor(['store', 'update'], 'permission:engins.lever_reserve');

    Route::apiResource('controles-engin', ControleEnginController::class)
        ->only(['index', 'show', 'store'])
        ->middlewareFor('store', 'permission:engins.controler|engins.importer');

    // --- Permissions ---
    // Lecture seule : les permissions sont définies dans le code
    // (PermissionSeeder.php) et ne se créent pas depuis l'interface.
    Route::get('/permissions', [PermissionController::class, 'index'])
        ->middleware('permission:roles.view|roles.create|roles.edit');

    // --- Sites ---
    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store'])
        ->middleware('permission:equipements.create|engins.create');

    // --- Types d'équipement (utilisés aussi par les engins) ---
    Route::get('/type-equipements', [TypeEquipementController::class, 'index']);
    Route::post('/type-equipements', [TypeEquipementController::class, 'store'])
        ->middleware('permission:donnees_base.create');
    Route::put('/type-equipements/{id}', [TypeEquipementController::class, 'update'])
        ->middleware('permission:donnees_base.edit');
    Route::delete('/type-equipements/{id}', [TypeEquipementController::class, 'destroy'])
        ->middleware('permission:donnees_base.delete');

    // --- Groupes d'équipement ---
    // Page "Données de base > Groupes" (Administration).
    Route::apiResource('groupes-equipement', GroupeEquipementController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middlewareFor('store', 'permission:donnees_base.create')
        ->middlewareFor('update', 'permission:donnees_base.edit')
        ->middlewareFor('destroy', 'permission:donnees_base.delete');

    // --- Rapports PDF (équipements puis engins) ---
    Route::get('/equipements/{id}/rapports', [RapportController::class, 'index']);
    Route::post('/equipements/{id}/rapports', [RapportController::class, 'store'])
        ->middleware('permission:equipements.rapports');

    Route::get('/engins/{id}/rapports', [RapportEnginController::class, 'index']);
    Route::post('/engins/{id}/rapports', [RapportEnginController::class, 'store'])
        ->middleware('permission:engins.rapports');

    // --- Assistant IA (équipements, engins, puis question libre) ---
    // Onglet "Assistant IA" de la fiche : une permission par type.
    Route::post('/equipements/{id}/assistant/plan-action', [AssistantController::class, 'planAction'])
        ->middleware('permission:equipements.assistant');
    Route::post('/equipements/{id}/assistant/points-controle', [AssistantController::class, 'pointsControle'])
        ->middleware('permission:equipements.assistant');
    Route::post('/engins/{id}/assistant/plan-action', [AssistantController::class, 'planActionEngin'])
        ->middleware('permission:engins.assistant');
    Route::post('/engins/{id}/assistant/points-controle', [AssistantController::class, 'pointsControleEngin'])
        ->middleware('permission:engins.assistant');
    Route::post('/assistant', [AssistantController::class, 'poser']);
});
