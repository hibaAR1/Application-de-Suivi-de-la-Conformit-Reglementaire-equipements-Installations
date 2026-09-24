<?php

namespace App\Modules\Role;

use App\Http\Controllers\Controller;

class RoleController extends Controller
{
    public function index()
    {
        return Role::all();
    }

    public function show($id)
    {
        return Role::findOrFail($id);
    }
}
