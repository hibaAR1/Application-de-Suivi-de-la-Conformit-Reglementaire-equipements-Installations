<?php

namespace App\Modules\Filiale;

use App\Http\Controllers\Controller;
use App\Modules\Filiale\Requests\StoreFilialeRequest;

class FilialeController extends Controller
{
    public function index()
    {
        return Filiale::all();
    }

    public function show($id)
    {
        return Filiale::findOrFail($id);
    }

    public function store(StoreFilialeRequest $request)
    {
        return Filiale::create($request->validated());
    }
}
