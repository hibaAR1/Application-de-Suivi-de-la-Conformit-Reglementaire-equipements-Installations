<?php

namespace App\Modules\Permission;

use App\Http\Controllers\Controller;
use App\Modules\Permission\Requests\StorePermissionRequest;
use App\Modules\Permission\Resources\PermissionResource;

class PermissionController extends Controller
{
    public function index()
    {
        return PermissionResource::collection(Permission::all());
    }

    // Page "Gestion des permissions" : ajout d'une nouvelle permission
    // (code + libellé). Elle n'est attachée à aucun rôle par défaut — ça se
    // fait ensuite depuis "Affecter des permissions par rôle".
    public function store(StorePermissionRequest $request)
    {
        $permission = Permission::create($request->validated());

        return response()->json(new PermissionResource($permission), 201);
    }
}
