<?php

namespace Tests\Security\Modules\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Auth\AuthTestHelpers;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;
    use AuthTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerAuthDeTest();
    }

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

    public function test_un_token_invalide_est_refuse(): void
    {
        $this->withHeader('Authorization', 'Bearer un-token-qui-nexiste-pas');

        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_le_message_derreur_est_identique_pour_un_nom_inconnu_et_un_mauvais_mot_de_passe(): void
    {
        $reponseNomInconnu = $this->postJson('/api/login', [
            'nom' => 'Personne Inconnue',
            'mot_de_passe' => 'PeuImporte123',
        ]);

        $reponseMauvaisMotDePasse = $this->postJson('/api/login', [
            'nom' => 'Administrateur',
            'mot_de_passe' => 'MauvaisMotDePasse',
        ]);

        $this->assertSame(401, $reponseNomInconnu->status());
        $this->assertSame(401, $reponseMauvaisMotDePasse->status());
        $this->assertSame($reponseNomInconnu->json('message'), $reponseMauvaisMotDePasse->json('message'));
    }

    public function test_un_nom_de_connexion_malveillant_ne_casse_rien(): void
    {
        $this->postJson('/api/login', [
            'nom' => "Administrateur' OR '1'='1",
            'mot_de_passe' => 'PeuImporte123',
        ])->assertStatus(401);

        $this->postJson('/api/login', [
            'nom' => 'Administrateur',
            'mot_de_passe' => "' OR '1'='1",
        ])->assertStatus(401);
    }

    public function test_le_changement_de_mot_de_passe_ne_change_pas_celui_dun_autre_utilisateur(): void
    {
        $victime = $this->utilisateurAvecMotDePasseConnu('MotDeLaVictime123');
        $attaquant = $this->utilisateurAvecMotDePasseConnu('MotDeLAttaquant123');
        $this->withHeader('Authorization', 'Bearer '.$this->jeton($attaquant->nom, 'MotDeLAttaquant123'));

        $this->postJson('/api/changer-mot-de-passe', [
            'id_utilisateur' => $victime->id_utilisateur,
            'mot_de_passe_actuel' => 'MotDeLAttaquant123',
            'nouveau_mot_de_passe' => 'MotImposeParLAttaquant',
            'nouveau_mot_de_passe_confirmation' => 'MotImposeParLAttaquant',
        ])->assertStatus(200);

        $this->postJson('/api/login', [
            'nom' => $victime->nom,
            'mot_de_passe' => 'MotDeLaVictime123',
        ])->assertStatus(200);
    }
}
