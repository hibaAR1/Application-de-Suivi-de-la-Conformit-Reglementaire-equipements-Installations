<?php

namespace App\Modules\Utilisateur;

use App\Http\Controllers\Controller;
use App\Modules\Utilisateur\Requests\StoreUtilisateurRequest;
use App\Modules\Utilisateur\Requests\UpdateUtilisateurRequest;
use App\Modules\Utilisateur\Resources\UtilisateurResource;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    public function index()
    {
        return UtilisateurResource::collection(Utilisateur::with(['role', 'filiales'])->get());
    }

    public function show($id)
    {
        return new UtilisateurResource(Utilisateur::with(['role', 'filiales'])->findOrFail($id));
    }

    public function store(StoreUtilisateurRequest $request)
    {
        $data = $request->validated();

        $idFiliales = $data['id_filiales'] ?? [];
        unset($data['id_filiales']);
        $data['mot_de_passe'] = Hash::make($data['mot_de_passe']);

        $utilisateur = Utilisateur::create($data);
        $utilisateur->filiales()->sync($idFiliales);

        return new UtilisateurResource($utilisateur->load(['role', 'filiales']));
    }

    public function update(UpdateUtilisateurRequest $request, $id)
    {
        $utilisateur = Utilisateur::findOrFail($id);

        $data = $request->validated();

        if (array_key_exists('id_filiales', $data)) {
            $utilisateur->filiales()->sync($data['id_filiales'] ?? []);
            unset($data['id_filiales']);
        }

        $utilisateur->update($data);
        return new UtilisateurResource($utilisateur->load(['role', 'filiales']));
    }

    public function destroy($id)
    {
        Utilisateur::findOrFail($id)->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}
