<?php

namespace Tests\Security\Modules\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Auth\AuthTestHelpers;
use Tests\TestCase;

// Tests de SÉCURITÉ de l'authentification : c'est la porte d'entrée de
// toute l'application, donc la plus sensible de toutes. Voir aussi :
// - tests/Feature/Modules/Auth → tests fonctionnels (comportement normal)
class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;
    use AuthTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerAuthDeTest();
    }

    // --- Authentification obligatoire sur les routes protégées -------------

    public function test_me_necessite_une_authentification(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_deconnexion_necessite_une_authentification(): void
    {
        $this->postJson('/api/logout')->assertStatus(401);
    }

    public function test_changer_mot_de_passe_necessite_une_authentification(): void
    {
        $this->postJson('/api/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'PeuImporte123',
            'nouveau_mot_de_passe' => 'NouveauMotDePasse123',
            'nouveau_mot_de_passe_confirmation' => 'NouveauMotDePasse123',
        ])->assertStatus(401);
    }

    // --- Un token invalide ou expiré est bien refusé ------------------------

    public function test_un_token_invalide_est_refuse(): void
    {
        $this->withHeader('Authorization', 'Bearer un-token-qui-nexiste-pas');

        $this->getJson('/api/me')->assertStatus(401);
    }

    // --- Pas de fuite d'information sur les comptes existants --------------

    public function test_le_message_derreur_est_identique_pour_un_email_inconnu_et_un_mauvais_mot_de_passe(): void
    {
        // Un attaquant ne doit pas pouvoir deviner quels emails existent en
        // comparant les messages d'erreur (voir AuthController::login()).
        $reponseEmailInconnu = $this->postJson('/api/login', [
            'email' => 'personne@menara-holding.ma',
            'mot_de_passe' => 'PeuImporte123',
        ]);

        $reponseMauvaisMotDePasse = $this->postJson('/api/login', [
            'email' => 'admin@menara-holding.ma',
            'mot_de_passe' => 'MauvaisMotDePasse',
        ]);

        $this->assertSame(401, $reponseEmailInconnu->status());
        $this->assertSame(401, $reponseMauvaisMotDePasse->status());
        $this->assertSame($reponseEmailInconnu->json('message'), $reponseMauvaisMotDePasse->json('message'));
    }

    // --- Entrées malveillantes ---------------------------------------------

    public function test_un_email_de_connexion_malveillant_ne_casse_rien(): void
    {
        // Eloquent lie ce paramètre via un bind, il n'est jamais concaténé
        // dans le SQL : ceci doit rester un simple échec de connexion, pas
        // une erreur serveur.
        $this->postJson('/api/login', [
            'email' => "admin@menara-holding.ma' OR '1'='1",
            'mot_de_passe' => 'PeuImporte123',
        ])->assertStatus(422); // rejeté par la règle de validation "email" avant même d'atteindre la base

        $this->postJson('/api/login', [
            'email' => 'admin@menara-holding.ma',
            'mot_de_passe' => "' OR '1'='1",
        ])->assertStatus(401); // atteint la base, mais Hash::check() échoue proprement
    }

    public function test_le_changement_de_mot_de_passe_ne_change_pas_celui_dun_autre_utilisateur(): void
    {
        // request()->user() vient du token, jamais d'un champ envoyé par le
        // client : impossible de changer le mot de passe de quelqu'un
        // d'autre en passant un autre id dans le corps de la requête.
        $victime = $this->utilisateurAvecMotDePasseConnu('MotDeLaVictime123');
        $attaquant = $this->utilisateurAvecMotDePasseConnu('MotDeLAttaquant123');
        $this->withHeader('Authorization', 'Bearer '.$this->jeton($attaquant->email, 'MotDeLAttaquant123'));

        $this->postJson('/api/changer-mot-de-passe', [
            'id_utilisateur' => $victime->id_utilisateur,
            'mot_de_passe_actuel' => 'MotDeLAttaquant123',
            'nouveau_mot_de_passe' => 'MotImposeParLAttaquant',
            'nouveau_mot_de_passe_confirmation' => 'MotImposeParLAttaquant',
        ])->assertStatus(200);

        // Le mot de passe de la victime doit être resté inchangé.
        $this->postJson('/api/login', [
            'email' => $victime->email,
            'mot_de_passe' => 'MotDeLaVictime123',
        ])->assertStatus(200);
    }
}
