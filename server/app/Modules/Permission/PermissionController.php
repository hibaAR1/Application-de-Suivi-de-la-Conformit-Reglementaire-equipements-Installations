<?php

namespace App\Modules\Permission;

use App\Http\Controllers\Controller;
use App\Modules\Permission\Resources\PermissionResource;

class PermissionController extends Controller
{
    public function index()
    {
        return PermissionResource::collection(Permission::all());
    }
}
