<?php

namespace Tests\Security\Modules\Role;

use App\Modules\Role\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Role\RoleTestHelpers;
use Tests\TestCase;

// Tests de SÉCURITÉ de l'API /api/roles : la gestion des rôles/permissions
// est réservée aux comptes ayant utilisateurs.manage (voir routes/api.php) —
// c'est la porte d'entrée vers tous les autres droits de l'application, donc
// particulièrement sensible. Voir aussi :
// - tests/Unit/Modules/Role    → tests unitaires (modèle)
// - tests/Feature/Modules/Role → tests fonctionnels (comportement normal)
class RoleSecurityTest extends TestCase
{
    use RefreshDatabase;
    use RoleTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerRoleDeTest();
    }

    // --- Authentification obligatoire -------------------------------------

    public function test_lister_les_roles_necessite_une_authentification(): void
    {
        $this->getJson('/api/roles')->assertStatus(401);
    }

    public function test_creer_un_role_necessite_une_authentification(): void
    {
        $this->postJson('/api/roles', $this->payloadValide())->assertStatus(401);
    }

    public function test_supprimer_un_role_necessite_une_authentification(): void
    {
        $role = Role::create(['libelle' => 'Rôle Sans Session']);

        $this->deleteJson("/api/roles/{$role->id_role}")->assertStatus(401);
    }

    // --- Permission utilisateurs.manage obligatoire -----------------------
    // (le Technicien terrain, connecté mais sans ce droit, doit être bloqué
    // aussi bien que côté écran (Sidebar.jsx) que côté API.)

    public function test_lister_les_roles_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();

        $this->getJson('/api/roles')->assertStatus(403);
    }

    public function test_creer_un_role_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();

        $this->postJson('/api/roles', $this->payloadValide())->assertStatus(403);
    }

    public function test_modifier_un_role_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();
        $role = Role::create(['libelle' => 'Rôle Protégé']);

        $this->putJson("/api/roles/{$role->id_role}", $this->payloadValide())->assertStatus(403);
    }

    public function test_supprimer_un_role_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();
        $role = Role::create(['libelle' => 'Rôle Protégé']);

        $this->deleteJson("/api/roles/{$role->id_role}")->assertStatus(403);

        // Et il ne doit évidemment pas avoir été supprimé malgré le refus.
        $this->assertDatabaseHas('role', ['id_role' => $role->id_role]);
    }

    // --- Le client ne peut pas imposer des données sensibles --------------

    public function test_lidentifiant_envoye_par_le_client_est_ignore(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/roles', $this->payloadValide([
            'id_role' => 999999,
        ]));

        $response->assertStatus(201);
        $this->assertNotSame(999999, $response->json('id_role'));
    }

    // --- Entrées malveillantes ---------------------------------------------

    public function test_des_id_permissions_inexistants_sont_rejetes(): void
    {
        $this->seConnecter();

        $this->postJson('/api/roles', $this->payloadValide([
            'id_permissions' => [999999],
        ]))->assertStatus(422)->assertJsonValidationErrors(['id_permissions.0']);
    }

    public function test_un_id_role_malveillant_dans_lurl_ne_casse_rien(): void
    {
        $this->seConnecter();

        // findOrFail() doit répondre 404 proprement, jamais une erreur SQL.
        $this->getJson('/api/roles/1%3B%20DROP%20TABLE%20role%3B%20--')->assertStatus(404);
    }
}
