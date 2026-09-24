<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\EquipementController;
use App\Http\Controllers\Api\FilialeController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\ReserveController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ControleController;
use App\Http\Controllers\Api\TypeEquipementController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\RapportController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Un seul aller-retour pour toutes les données de démarrage (voir
    // BootstrapController) au lieu de 4 requêtes séparées lancées en même
    // temps par le client — ça évitait qu'elles s'empilent sur le serveur
    // de dev et faisait tomber le chargement initial de 5-7s à ~1s.
    Route::get('/donnees-initiales', [BootstrapController::class, 'index']);

    Route::apiResource('equipements', EquipementController::class);
    Route::apiResource('filiales', FilialeController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('utilisateurs', UtilisateurController::class);
    Route::apiResource('reserves', ReserveController::class);

    Route::apiResource('controles', ControleController::class)->only(['index', 'show', 'store']);
    Route::apiResource('permissions', PermissionController::class)->only(['index']);

    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store']);

    Route::get('/type-equipements', [TypeEquipementController::class, 'index']);
    Route::post('/type-equipements', [TypeEquipementController::class, 'store']);

    Route::get('/equipements/{id}/rapports', [RapportController::class, 'index']);
    Route::post('/equipements/{id}/rapports', [RapportController::class, 'store']);

    Route::post('/equipements/{id}/assistant/plan-action', [AssistantController::class, 'planAction']);
    Route::post('/equipements/{id}/assistant/points-controle', [AssistantController::class, 'pointsControle']);

    Route::post('/assistant', [AssistantController::class, 'poser']);
});
