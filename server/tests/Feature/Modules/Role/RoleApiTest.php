<?php

namespace Tests\Feature\Modules\Role;

use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Role\RoleTestHelpers;
use Tests\TestCase;

// Tests FONCTIONNELS de l'API /api/roles : voir aussi
// - tests/Unit/Modules/Role     → tests unitaires (modèle)
// - tests/Security/Modules/Role → tests de sécurité
class RoleApiTest extends TestCase
{
    use RefreshDatabase;
    use RoleTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerRoleDeTest();
    }

    // --- Lecture -----------------------------------------------------------

    public function test_la_liste_retourne_les_roles_avec_leurs_permissions(): void
    {
        $this->seConnecter();

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([['id_role', 'libelle', 'description', 'permissions']]);
        // Les 5 rôles du CDC sont déjà seedés (voir RoleSeeder).
        $this->assertGreaterThanOrEqual(5, count($response->json()));
    }

    // --- Création ------------------------------------------------------------

    public function test_la_creation_cree_un_role_avec_ses_permissions(): void
    {
        $this->seConnecter();
        $permission = $this->permissionExistante();

        $response = $this->postJson('/api/roles', $this->payloadValide([
            'id_permissions' => [$permission->id_permission],
        ]));

        $response->assertStatus(201)
            ->assertJsonPath('permissions.0.code', 'equipements.view');
        $this->assertDatabaseHas('role', ['libelle' => $response->json('libelle')]);
    }

    public function test_la_creation_echoue_si_le_libelle_existe_deja(): void
    {
        $this->seConnecter();

        $this->postJson('/api/roles', $this->payloadValide(['libelle' => 'Technicien terrain']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['libelle']);
    }

    public function test_la_creation_echoue_si_le_libelle_manque(): void
    {
        $this->seConnecter();

        $this->postJson('/api/roles', ['description' => 'sans libellé'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['libelle']);
    }

    // --- Modification --------------------------------------------------------

    public function test_la_modification_met_a_jour_le_libelle_et_remplace_les_permissions(): void
    {
        $this->seConnecter();
        $permission = $this->permissionExistante();
        $role = Role::create(['libelle' => 'Rôle À Modifier']);

        $response = $this->putJson("/api/roles/{$role->id_role}", $this->payloadValide([
            'libelle' => 'Rôle Modifié',
            'id_permissions' => [$permission->id_permission],
        ]));

        $response->assertStatus(200)
            ->assertJsonPath('libelle', 'Rôle Modifié')
            ->assertJsonCount(1, 'permissions');
    }

    public function test_la_modification_autorise_a_garder_son_propre_libelle(): void
    {
        $this->seConnecter();
        $role = Role::create(['libelle' => 'Libellé Inchangé']);

        // La règle Rule::unique(...)->ignore() ne doit pas rejeter le rôle
        // quand on lui renvoie son propre libellé.
        $this->putJson("/api/roles/{$role->id_role}", $this->payloadValide(['libelle' => 'Libellé Inchangé']))
            ->assertStatus(200);
    }

    // --- Suppression -----------------------------------------------------

    public function test_la_suppression_supprime_un_role_non_utilise(): void
    {
        $this->seConnecter();
        $role = Role::create(['libelle' => 'Rôle Sans Utilisateur']);

        $this->deleteJson("/api/roles/{$role->id_role}")->assertStatus(200);

        $this->assertDatabaseMissing('role', ['id_role' => $role->id_role]);
    }

    public function test_la_suppression_est_bloquee_si_un_utilisateur_a_encore_ce_role(): void
    {
        $this->seConnecter();
        $role = Role::create(['libelle' => 'Rôle Encore Utilisé']);
        Utilisateur::create([
            'nom' => 'Titulaire',
            'email' => 'titulaire.'.uniqid().'@menara-holding.ma',
            'mot_de_passe' => bcrypt('PeuImporte123'),
            'id_role' => $role->id_role,
            'actif' => true,
        ]);

        $this->deleteJson("/api/roles/{$role->id_role}")->assertStatus(422);

        // Le rôle ne doit PAS avoir été supprimé.
        $this->assertDatabaseHas('role', ['id_role' => $role->id_role]);
    }
}
