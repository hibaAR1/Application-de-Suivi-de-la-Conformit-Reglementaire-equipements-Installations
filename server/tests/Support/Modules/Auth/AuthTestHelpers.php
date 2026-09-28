<?php

namespace Tests\Support\Modules\Auth;

use App\Models\Role;
use App\Models\Utilisateur;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;

trait AuthTestHelpers
{
    protected function preparerAuthDeTest(): void
    {
        $this->seed(DatabaseSeeder::class);
    }

    // Jeton pour le compte Super Admin, via le vrai flux /api/login.
    private function jeton(string $nom = 'Administrateur', string $motDePasse = 'MenaraAdmin2026!'): string
    {
        $token = $this->postJson('/api/login', [
            'nom' => $nom,
            'mot_de_passe' => $motDePasse,
        ])->json('token');

        $this->assertIsString($token, 'La connexion de test a échoué, impossible de récupérer un token.');

        return $token;
    }

    // Nom rendu unique (uniqid) : certains tests créent 2 comptes de ce
    // type dans le même test, et "nom" est maintenant unique en base.
    private function utilisateurAvecMotDePasseConnu(string $motDePasse = 'AncienMotDePasse123'): Utilisateur
    {
        $role = Role::where('libelle', 'Technicien terrain')->firstOrFail();

        return Utilisateur::create([
            'nom' => 'Utilisateur Test Auth '.uniqid(),
            'email' => 'auth.test.'.uniqid().'@menara-holding.ma',
            'mot_de_passe' => Hash::make($motDePasse),
            'id_role' => $role->id_role,
            'actif' => true,
            'doit_changer_mot_passe' => true,
        ]);
    }
}
