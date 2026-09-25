<?php

namespace Tests\Security\Modules\Utilisateur;

use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\Modules\Utilisateur\UtilisateurTestHelpers;
use Tests\TestCase;

// Tests de SÉCURITÉ de l'API /api/utilisateurs : c'est ici que sont gérés
// les comptes et les mots de passe, donc particulièrement sensible. Voir
// aussi :
// - tests/Unit/Modules/Utilisateur    → tests unitaires (modèle)
// - tests/Feature/Modules/Utilisateur → tests fonctionnels (comportement normal)
class UtilisateurSecurityTest extends TestCase
{
    use RefreshDatabase;
    use UtilisateurTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerUtilisateurDeTest();
    }

    // --- Authentification obligatoire -------------------------------------

    public function test_lister_les_utilisateurs_necessite_une_authentification(): void
    {
        $this->getJson('/api/utilisateurs')->assertStatus(401);
    }

    public function test_creer_un_utilisateur_necessite_une_authentification(): void
    {
        $this->postJson('/api/utilisateurs', $this->payloadValide())->assertStatus(401);
    }

    public function test_supprimer_un_utilisateur_necessite_une_authentification(): void
    {
        $utilisateur = Utilisateur::create(array_merge($this->payloadValide(), [
            'mot_de_passe' => Hash::make('PeuImporte123'),
        ]));

        $this->deleteJson("/api/utilisateurs/{$utilisateur->id_utilisateur}")->assertStatus(401);
    }

    // --- Permission utilisateurs.manage obligatoire -----------------------
    // (le Technicien terrain, connecté mais sans ce droit, doit être bloqué
    // aussi bien que côté écran (Sidebar.jsx) que côté API — sinon
    // n'importe quel compte pourrait se créer un accès Super Admin.)

    public function test_lister_les_utilisateurs_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();

        $this->getJson('/api/utilisateurs')->assertStatus(403);
    }

    public function test_creer_un_utilisateur_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();

        $this->postJson('/api/utilisateurs', $this->payloadValide())->assertStatus(403);
    }

    public function test_modifier_un_utilisateur_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $utilisateurSansDroit = $this->seConnecterSansDroit();

        // Même essayer de se donner le rôle Super Admin à soi-même doit être
        // bloqué avant d'atteindre le contrôleur.
        $superAdmin = Role::where('libelle', 'Super Admin')->firstOrFail();
        $this->putJson("/api/utilisateurs/{$utilisateurSansDroit->id_utilisateur}", [
            'id_role' => $superAdmin->id_role,
        ])->assertStatus(403);

        $this->assertDatabaseMissing('utilisateur', [
            'id_utilisateur' => $utilisateurSansDroit->id_utilisateur,
            'id_role' => $superAdmin->id_role,
        ]);
    }

    public function test_supprimer_un_utilisateur_est_refuse_sans_la_permission_utilisateurs_manage(): void
    {
        $this->seConnecterSansDroit();
        $utilisateur = Utilisateur::create(array_merge($this->payloadValide(), [
            'mot_de_passe' => Hash::make('PeuImporte123'),
        ]));

        $this->deleteJson("/api/utilisateurs/{$utilisateur->id_utilisateur}")->assertStatus(403);

        $this->assertDatabaseHas('utilisateur', ['id_utilisateur' => $utilisateur->id_utilisateur]);
    }

    // --- Le client ne peut pas imposer des données sensibles --------------

    public function test_lidentifiant_envoye_par_le_client_est_ignore(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/utilisateurs', $this->payloadValide([
            'id_utilisateur' => 999999,
        ]));

        $response->assertStatus(201);
        $this->assertNotSame(999999, $response->json('id_utilisateur'));
    }

    public function test_le_flag_doit_changer_mot_passe_envoye_par_le_client_est_ignore_a_la_creation(): void
    {
        $this->seConnecter();

        // Un client malveillant qui tenterait de créer un compte SANS
        // obligation de changer le mot de passe temporaire ne doit pas
        // pouvoir le faire : le contrôleur force toujours true (voir
        // UtilisateurController::store()).
        $response = $this->postJson('/api/utilisateurs', $this->payloadValide([
            'doit_changer_mot_passe' => false,
        ]));

        $response->assertStatus(201)->assertJsonPath('doit_changer_mot_passe', true);
    }

    // --- Modification du mot de passe --------------------------------------
    //
    // Corrigé : UpdateUtilisateurRequest ne déclarait aucune règle pour
    // "mot_de_passe", donc $request->validated() l'ignorait silencieusement
    // et l'écran "Modifier utilisateur" ne changeait jamais le mot de passe,
    // sans aucune erreur affichée. Ce test protège contre une régression.
    public function test_la_modification_du_mot_de_passe_doit_etre_prise_en_compte(): void
    {
        $this->seConnecter();
        $utilisateur = Utilisateur::create(array_merge($this->payloadValide(), [
            'mot_de_passe' => Hash::make('AncienMotDePasse123'),
        ]));

        $this->putJson("/api/utilisateurs/{$utilisateur->id_utilisateur}", [
            'mot_de_passe' => 'NouveauMotDePasse123',
        ])->assertStatus(200);

        $utilisateur->refresh();
        $this->assertTrue(
            Hash::check('NouveauMotDePasse123', $utilisateur->mot_de_passe),
            "Le mot de passe n'a pas été mis à jour : voir le commentaire au-dessus de ce test."
        );
    }
}
