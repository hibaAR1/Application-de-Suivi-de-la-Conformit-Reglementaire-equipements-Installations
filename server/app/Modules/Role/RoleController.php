<?php

namespace App\Modules\Role;

use App\Http\Controllers\Controller;
use App\Modules\Role\Resources\RoleResource;

class RoleController extends Controller
{
    public function index()
    {
        return RoleResource::collection(Role::all());
    }

    public function show($id)
    {
        return new RoleResource(Role::findOrFail($id));
    }
}
