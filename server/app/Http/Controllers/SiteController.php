<?php

namespace App\Http\Controllers;

use App\Models\Site;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteRequest;
use App\Http\Resources\SiteResource;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index(Request $request)
    {
        $query = Site::query();

        if ($request->has('id_filiale')) {
            $query->where('id_filiale', $request->id_filiale);
        }

        return SiteResource::collection($query->orderBy('libelle')->get());
    }

    public function store(StoreSiteRequest $request)
    {
        return new SiteResource(Site::create($request->validated()));
    }
}
