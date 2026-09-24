<?php

namespace App\Modules\Site;

use App\Http\Controllers\Controller;
use App\Modules\Site\Requests\StoreSiteRequest;
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

    public function store(StoreSiteRequest $request)
    {
        return Site::create($request->validated());
    }
}
