<?php

namespace Tests\Feature\Modules\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Auth\AuthTestHelpers;
use Tests\TestCase;

// Tests FONCTIONNELS de l'authentification (/api/login, /api/logout,
// /api/me, /api/changer-mot-de-passe) : voir aussi
// - tests/Security/Modules/Auth → tests de sécurité
class AuthApiTest extends TestCase
{
    use RefreshDatabase;
    use AuthTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerAuthDeTest();
    }

    // --- Connexion -------------------------------------------------------------

    public function test_la_connexion_reussit_avec_les_bons_identifiants_et_retourne_un_token(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@menara-holding.ma',
            'mot_de_passe' => 'MenaraAdmin2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'utilisateur' => ['id_utilisateur', 'email', 'role']]);
    }

    public function test_la_connexion_charge_le_role_avec_ses_permissions(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@menara-holding.ma',
            'mot_de_passe' => 'MenaraAdmin2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['utilisateur' => ['role' => ['permissions']]]);
        $this->assertNotEmpty($response->json('utilisateur.role.permissions'));
    }

    public function test_la_connexion_echoue_avec_un_mauvais_mot_de_passe(): void
    {
        $this->postJson('/api/login', [
            'email' => 'admin@menara-holding.ma',
            'mot_de_passe' => 'MauvaisMotDePasse',
        ])->assertStatus(401)->assertJsonPath('message', 'Identifiants invalides');
    }

    public function test_la_connexion_echoue_avec_un_email_inconnu(): void
    {
        $this->postJson('/api/login', [
            'email' => 'personne@menara-holding.ma',
            'mot_de_passe' => 'PeuImporte123',
        ])->assertStatus(401)->assertJsonPath('message', 'Identifiants invalides');
    }

    // --- /api/me -----------------------------------------------------------

    public function test_me_retourne_lutilisateur_connecte(): void
    {
        $this->withHeader('Authorization', 'Bearer '.$this->jeton());

        $this->getJson('/api/me')
            ->assertStatus(200)
            ->assertJsonPath('email', 'admin@menara-holding.ma');
    }

    // --- Déconnexion ---------------------------------------------------------

    public function test_la_deconnexion_invalide_le_token(): void
    {
        $token = $this->jeton();
        $this->withHeader('Authorization', "Bearer {$token}");

        $this->postJson('/api/logout')->assertStatus(200);

        // app('auth')->forgetGuards() : en conditions réelles chaque requête
        // HTTP est un nouveau processus, donc rien n'est mis en cache entre
        // deux requêtes. Ici, comme les deux requêtes du test tournent dans
        // le même process PHPUnit, il faut vider ce cache nous-mêmes pour
        // que le test revérifie vraiment le token en base plutôt que de
        // réutiliser le résultat (positif) de la requête précédente.
        app('auth')->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}");

        // Le même token ne doit plus fonctionner après déconnexion.
        $this->getJson('/api/me')->assertStatus(401);
    }

    // --- Changement de mot de passe ------------------------------------------

    public function test_le_changement_de_mot_de_passe_reussit_et_desactive_lobligation(): void
    {
        $utilisateur = $this->utilisateurAvecMotDePasseConnu();
        $this->withHeader('Authorization', 'Bearer '.$this->jeton($utilisateur->email, 'AncienMotDePasse123'));

        $response = $this->postJson('/api/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'AncienMotDePasse123',
            'nouveau_mot_de_passe' => 'NouveauMotDePasse123',
            'nouveau_mot_de_passe_confirmation' => 'NouveauMotDePasse123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('utilisateur.doit_changer_mot_passe', false);

        // Et le nouveau mot de passe doit permettre de se reconnecter.
        $this->postJson('/api/login', [
            'email' => $utilisateur->email,
            'mot_de_passe' => 'NouveauMotDePasse123',
        ])->assertStatus(200);
    }

    public function test_le_changement_de_mot_de_passe_echoue_si_la_confirmation_ne_correspond_pas(): void
    {
        $utilisateur = $this->utilisateurAvecMotDePasseConnu();
        $this->withHeader('Authorization', 'Bearer '.$this->jeton($utilisateur->email, 'AncienMotDePasse123'));

        $this->postJson('/api/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'AncienMotDePasse123',
            'nouveau_mot_de_passe' => 'NouveauMotDePasse123',
            'nouveau_mot_de_passe_confirmation' => 'AutreChose123',
        ])->assertStatus(422)->assertJsonValidationErrors(['nouveau_mot_de_passe']);
    }

    public function test_le_changement_de_mot_de_passe_echoue_si_le_mot_de_passe_actuel_est_faux(): void
    {
        $utilisateur = $this->utilisateurAvecMotDePasseConnu();
        $this->withHeader('Authorization', 'Bearer '.$this->jeton($utilisateur->email, 'AncienMotDePasse123'));

        $this->postJson('/api/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'FauxMotDePasse',
            'nouveau_mot_de_passe' => 'NouveauMotDePasse123',
            'nouveau_mot_de_passe_confirmation' => 'NouveauMotDePasse123',
        ])->assertStatus(422)->assertJsonPath('message', 'Mot de passe actuel incorrect.');
    }
}
