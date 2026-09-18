<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filiale;
use Illuminate\Http\Request;

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

    public function store(Request $request)
    {
        $data = $request->validate([
            'libelle' => 'required|string|max:150',
            'code' => 'required|in:MP,CTM,MT,ML,TCGM|unique:filiale',
        ]);

        return Filiale::create($data);
    }
}
