<?php

namespace App\Http\Controllers;

use App\Models\Permission;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;

class PermissionController extends Controller
{
    // Liste des permissions affichée dans "Rôles & Permissions" et dans le
    // formulaire d'un rôle. Les permissions ne se créent pas depuis
    // l'interface : elles sont définies dans le code (PermissionSeeder.php),
    // chacune étant vérifiée par une route et par un écran.
    public function index()
    {
        return PermissionResource::collection(Permission::all());
    }
}
