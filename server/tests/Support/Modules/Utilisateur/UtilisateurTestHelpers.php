<?php

namespace Tests\Support\Modules\Utilisateur;

use App\Modules\Filiale\Filiale;
use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Database\Seeders\DatabaseSeeder;

// Préparation commune aux tests fonctionnels et sécurité de Utilisateur
// (voir tests/Support/Modules/Role/RoleTestHelpers pour le même principe) :
// seed, connexion via le vrai flux /api/login, payload valide.
trait UtilisateurTestHelpers
{
    private Utilisateur $utilisateur;

    protected function preparerUtilisateurDeTest(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->utilisateur = Utilisateur::where('email', 'admin@menara-holding.ma')->firstOrFail();
    }

    private function seConnecter(): void
    {
        $token = $this->postJson('/api/login', [
            'email' => $this->utilisateur->email,
            'mot_de_passe' => 'MenaraAdmin2026!',
        ])->json('token');

        $this->assertIsString($token, 'La connexion de test a échoué, impossible de récupérer un token.');

        $this->withHeader('Authorization', "Bearer {$token}");
    }

    // Un compte SANS la permission utilisateurs.manage (voir
    // PermissionSeeder.php), pour les tests de sécurité.
    private function seConnecterSansDroit(): Utilisateur
    {
        $utilisateur = Utilisateur::where('email', 'technicien.ctm@menara-holding.ma')->firstOrFail();

        $token = $this->postJson('/api/login', [
            'email' => $utilisateur->email,
            'mot_de_passe' => 'MenaraTech2026!',
        ])->json('token');

        $this->assertIsString($token, 'La connexion de test a échoué, impossible de récupérer un token.');

        $this->withHeader('Authorization', "Bearer {$token}");

        return $utilisateur;
    }

    private function payloadValide(array $overrides = []): array
    {
        return array_merge([
            'nom' => 'Utilisateur Test',
            'email' => 'utilisateur.test.'.uniqid().'@menara-holding.ma',
            'mot_de_passe' => 'MotDePasseTest123',
            'id_role' => $this->roleExistant()->id_role,
        ], $overrides);
    }

    private function roleExistant(): Role
    {
        return Role::where('libelle', 'Technicien terrain')->firstOrFail();
    }

    private function filialeExistante(): Filiale
    {
        return Filiale::where('code', 'CTM')->firstOrFail();
    }
}
