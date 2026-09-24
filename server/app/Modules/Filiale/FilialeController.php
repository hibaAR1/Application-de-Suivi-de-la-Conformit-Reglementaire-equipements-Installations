<?php

namespace App\Modules\Filiale;

use App\Http\Controllers\Controller;
use App\Modules\Filiale\Requests\StoreFilialeRequest;
use App\Modules\Filiale\Resources\FilialeResource;

class FilialeController extends Controller
{
    public function index()
    {
        return FilialeResource::collection(Filiale::all());
    }

    public function show($id)
    {
        return new FilialeResource(Filiale::findOrFail($id));
    }

    public function store(StoreFilialeRequest $request)
    {
        return new FilialeResource(Filiale::create($request->validated()));
    }
}
