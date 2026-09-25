<?php

namespace Tests\Support\Modules\Role;

use App\Modules\Permission\Permission;
use App\Modules\Utilisateur\Utilisateur;
use Database\Seeders\DatabaseSeeder;

// Préparation commune aux tests fonctionnels et sécurité de Role (voir
// tests/Support/Modules/Equipement/EquipementTestHelpers pour le même
// principe) : seed, connexion via le vrai flux /api/login, payload valide.
trait RoleTestHelpers
{
    private Utilisateur $utilisateur;

    protected function preparerRoleDeTest(): void
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
            'libelle' => 'Rôle Test '.uniqid(),
            'description' => 'Un rôle créé pour les tests.',
        ], $overrides);
    }

    private function permissionExistante(): Permission
    {
        return Permission::where('code', 'equipements.view')->firstOrFail();
    }
}
