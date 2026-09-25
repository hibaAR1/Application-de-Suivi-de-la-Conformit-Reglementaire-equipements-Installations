<?php

namespace Tests\Support\Modules\Auth;

use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;

// Préparation commune aux tests fonctionnels et sécurité de Auth (voir
// tests/Support/Modules/Role/RoleTestHelpers pour le même principe).
trait AuthTestHelpers
{
    protected function preparerAuthDeTest(): void
    {
        $this->seed(DatabaseSeeder::class);
    }

    // Jeton pour le compte Super Admin, via le vrai flux /api/login.
    private function jeton(string $email = 'admin@menara-holding.ma', string $motDePasse = 'MenaraAdmin2026!'): string
    {
        $token = $this->postJson('/api/login', [
            'email' => $email,
            'mot_de_passe' => $motDePasse,
        ])->json('token');

        $this->assertIsString($token, 'La connexion de test a échoué, impossible de récupérer un token.');

        return $token;
    }

    // Crée un compte de test dont on connaît le mot de passe en clair, pour
    // les scénarios de changement de mot de passe.
    private function utilisateurAvecMotDePasseConnu(string $motDePasse = 'AncienMotDePasse123'): Utilisateur
    {
        $role = Role::where('libelle', 'Technicien terrain')->firstOrFail();

        return Utilisateur::create([
            'nom' => 'Utilisateur Test Auth',
            'email' => 'auth.test.'.uniqid().'@menara-holding.ma',
            'mot_de_passe' => Hash::make($motDePasse),
            'id_role' => $role->id_role,
            'actif' => true,
            'doit_changer_mot_passe' => true,
        ]);
    }
}
