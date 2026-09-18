<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EquipementController;
use App\Http\Controllers\Api\FilialeController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\ReserveController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('equipements', EquipementController::class);
    Route::apiResource('filiales', FilialeController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('utilisateurs', UtilisateurController::class);
    Route::apiResource('reserves', ReserveController::class);
});
