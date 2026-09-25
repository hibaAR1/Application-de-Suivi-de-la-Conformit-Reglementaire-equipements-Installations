<?php

namespace Tests\Browser;

use App\Modules\Utilisateur\Utilisateur;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Couvre la connexion pour les 5 comptes de rôle seedés (UtilisateurSeeder),
// l'échec de connexion, la protection des routes, et la déconnexion.
// Les identifiants ci-dessous sont ceux créés par UtilisateurSeeder — si tu
// les as changés, mets-les à jour ici aussi.
class AuthentificationTest extends DuskTestCase
{
    public static function comptesSeedes(): array
    {
        return [
            'Super Admin' => ['admin@menara-holding.ma', 'MenaraAdmin2026!'],
            'Administrateur SMI Holding' => ['smi@menara-holding.ma', 'MenaraSMI2026!'],
            'Référent HSE filiale' => ['hse.ctm@menara-holding.ma', 'MenaraHSE2026!'],
            'Technicien terrain' => ['technicien.ctm@menara-holding.ma', 'MenaraTech2026!'],
            'Consultation Direction' => ['direction@menara-holding.ma', 'MenaraDirection2026!'],
        ];
    }

    /**
     * Un test par rôle : connexion réussie -> arrivée sur le tableau de
     * bord, avec le bon libellé de rôle affiché dans la barre latérale.
     */
    public function test_connexion_reussie_pour_chaque_role(): void
    {
        foreach (self::comptesSeedes() as $role => [$email, $motDePasse]) {
            $this->browse(function (Browser $browser) use ($role, $email, $motDePasse) {
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', $email)
                    ->type('.login-label:nth-child(2) input', $motDePasse)
                    ->press('Se connecter')
                    ->waitUntilMissing('.login-page', 10)
                    ->assertPathIsNot('/login')
                    ->assertSee($role);
                // Pas besoin de se déconnecter explicitement : chaque appel à
                // $this->browse() ouvre une session de navigateur neuve, donc
                // le compte suivant repart sans rien en mémoire.
            });
        }
    }

    public function test_echec_connexion_mauvais_mot_de_passe(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'admin@menara-holding.ma')
                ->type('.login-label:nth-child(2) input', 'CeMotDePasseEstFaux')
                ->press('Se connecter')
                ->waitFor('.login-error', 10)
                ->assertPathIs('/login')
                ->assertVisible('.login-error');
        });
    }

    public function test_email_inconnu_refuse(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'personne@menara-holding.ma')
                ->type('.login-label:nth-child(2) input', 'PeuImporte123')
                ->press('Se connecter')
                ->waitFor('.login-error', 10)
                ->assertPathIs('/login');
        });
    }

    public function test_page_protegee_redirige_vers_login_si_non_connecte(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->script('window.localStorage.clear()');
            $browser->visit('/equipements')
                ->waitForLocation('/login', 10)
                ->assertPathIs('/login');
        });
    }

    public function test_deconnexion_ramene_vers_login(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'admin@menara-holding.ma')
                ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
                ->press('Se connecter')
                ->waitUntilMissing('.login-page', 10)
                ->assertPathIsNot('/login')
                ->click('button[title="Se déconnecter"]')
                ->waitForLocation('/login', 10)
                ->assertPathIs('/login');
        });
    }
}
