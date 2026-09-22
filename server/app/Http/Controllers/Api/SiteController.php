<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index(Request $request)
    {
        $query = Site::query();

        if ($request->has('id_filiale')) {
            $query->where('id_filiale', $request->id_filiale);
        }

        return $query->orderBy('libelle')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50',
            'libelle' => 'required|string|max:150',
            'id_filiale' => 'required|integer',
        ]);

        return Site::create($data);
    }
}
