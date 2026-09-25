<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Vérifie, CÔTÉ SERVEUR, que l'utilisateur connecté a bien la permission
// demandée avant d'exécuter la route — contrairement à
// user.hasPermission() côté React qui ne fait que cacher un bouton à
// l'écran : ça ne bloque rien si quelqu'un appelle l'API directement
// (Postman, curl...) sans passer par l'écran.
//
// Utilisation sur une route : ->middleware('permission:equipements.create')
// Plusieurs permissions acceptées (l'utilisateur doit avoir AU MOINS une
// des deux) : ->middleware('permission:utilisateurs.manage|equipements.create')
class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $utilisateur = $request->user();
        $permissionsAcceptees = explode('|', $permission);

        $autorise = $utilisateur && collect($permissionsAcceptees)
            ->contains(fn ($code) => $utilisateur->hasPermission($code));

        if (!$autorise) {
            abort(403, 'Action non autorisée : permission requise.');
        }

        return $next($request);
    }
}
