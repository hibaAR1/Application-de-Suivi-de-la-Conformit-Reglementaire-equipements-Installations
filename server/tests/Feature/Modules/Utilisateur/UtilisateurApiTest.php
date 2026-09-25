<?php

namespace Tests\Feature\Modules\Utilisateur;

use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\Modules\Utilisateur\UtilisateurTestHelpers;
use Tests\TestCase;

// Tests FONCTIONNELS de l'API /api/utilisateurs : voir aussi
// - tests/Unit/Modules/Utilisateur     → tests unitaires (modèle)
// - tests/Security/Modules/Utilisateur → tests de sécurité
class UtilisateurApiTest extends TestCase
{
    use RefreshDatabase;
    use UtilisateurTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerUtilisateurDeTest();
    }

    // --- Lecture -------------------------------------------------------------

    public function test_la_liste_retourne_les_utilisateurs_avec_leur_role(): void
    {
        $this->seConnecter();

        $response = $this->getJson('/api/utilisateurs');

        $response->assertStatus(200)
            ->assertJsonStructure([['id_utilisateur', 'nom', 'email', 'actif', 'role']]);
        // Les 5 comptes du CDC sont déjà seedés (voir UtilisateurSeeder).
        $this->assertGreaterThanOrEqual(5, count($response->json()));
    }

    public function test_le_mot_de_passe_najamais_dans_la_reponse(): void
    {
        $this->seConnecter();

        $response = $this->getJson('/api/utilisateurs');

        $response->assertStatus(200);
        foreach ($response->json() as $utilisateur) {
            $this->assertArrayNotHasKey('mot_de_passe', $utilisateur);
        }
    }

    // --- Création --------------------------------------------------------------

    public function test_la_creation_cree_un_utilisateur_avec_mot_de_passe_a_changer_au_premier_login(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/utilisateurs', $this->payloadValide());

        $response->assertStatus(201)
            ->assertJsonPath('doit_changer_mot_passe', true);
        $utilisateur = Utilisateur::where('email', $response->json('email'))->firstOrFail();
        // Le mot de passe temporaire doit être haché, jamais stocké en clair.
        $this->assertTrue(Hash::check('MotDePasseTest123', $utilisateur->mot_de_passe));
    }

    public function test_la_creation_rattache_les_filiales_choisies(): void
    {
        $this->seConnecter();
        $filiale = $this->filialeExistante();

        $response = $this->postJson('/api/utilisateurs', $this->payloadValide([
            'id_filiales' => [$filiale->id_filiale],
        ]));

        $response->assertStatus(201)->assertJsonCount(1, 'filiales');
    }

    public function test_la_creation_echoue_si_lemail_existe_deja(): void
    {
        $this->seConnecter();

        $this->postJson('/api/utilisateurs', $this->payloadValide(['email' => 'admin@menara-holding.ma']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_la_creation_echoue_si_le_mot_de_passe_est_trop_court(): void
    {
        $this->seConnecter();

        $this->postJson('/api/utilisateurs', $this->payloadValide(['mot_de_passe' => 'court']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['mot_de_passe']);
    }

    public function test_la_creation_echoue_si_le_role_nexiste_pas(): void
    {
        $this->seConnecter();

        $this->postJson('/api/utilisateurs', $this->payloadValide(['id_role' => 999999]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['id_role']);
    }

    // --- Modification ----------------------------------------------------------

    public function test_la_modification_met_a_jour_le_nom_et_le_role(): void
    {
        $this->seConnecter();
        $autreRole = Role::where('libelle', 'Référent HSE filiale')->firstOrFail();
        $utilisateur = Utilisateur::create(array_merge($this->payloadValide(), [
            'mot_de_passe' => Hash::make('PeuImporte123'),
        ]));

        $response = $this->putJson("/api/utilisateurs/{$utilisateur->id_utilisateur}", [
            'nom' => 'Nom Modifié',
            'id_role' => $autreRole->id_role,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('nom', 'Nom Modifié')
            ->assertJsonPath('id_role', $autreRole->id_role);
    }

    public function test_la_modification_peut_desactiver_un_compte(): void
    {
        $this->seConnecter();
        $utilisateur = Utilisateur::create(array_merge($this->payloadValide(), [
            'mot_de_passe' => Hash::make('PeuImporte123'),
            'actif' => true,
        ]));

        $this->putJson("/api/utilisateurs/{$utilisateur->id_utilisateur}", ['actif' => false])
            ->assertStatus(200)
            ->assertJsonPath('actif', false);
    }

    // --- Suppression -----------------------------------------------------------

    public function test_la_suppression_supprime_lutilisateur(): void
    {
        $this->seConnecter();
        $utilisateur = Utilisateur::create(array_merge($this->payloadValide(), [
            'mot_de_passe' => Hash::make('PeuImporte123'),
        ]));

        $this->deleteJson("/api/utilisateurs/{$utilisateur->id_utilisateur}")->assertStatus(200);

        $this->assertDatabaseMissing('utilisateur', ['id_utilisateur' => $utilisateur->id_utilisateur]);
    }
}
