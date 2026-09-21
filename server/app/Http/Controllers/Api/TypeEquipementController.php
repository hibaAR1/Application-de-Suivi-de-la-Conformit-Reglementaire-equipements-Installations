<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeEquipement;
use Illuminate\Http\Request;

class TypeEquipementController extends Controller
{
    public function index()
    {
        return TypeEquipement::orderBy('libelle')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'libelle' => 'required|string|max:100|unique:type_equipement,libelle',
            'periodicite_controle' => 'required|integer|min:1',
        ]);

        return TypeEquipement::create($data);
    }
}
