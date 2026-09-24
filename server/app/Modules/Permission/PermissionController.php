<?php

namespace App\Modules\Permission;

use App\Http\Controllers\Controller;

class PermissionController extends Controller
{
    public function index()
    {
        return Permission::all();
    }
}
