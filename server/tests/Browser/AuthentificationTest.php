<?php

namespace Tests\Browser;

use App\Models\Utilisateur;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AuthentificationTest extends DuskTestCase
{
    public static function comptesSeedes(): array
    {
        return [
            'Super Admin' => ['Administrateur', 'MenaraAdmin2026!'],
            'Administrateur SMI Holding' => ['Responsable SMI', 'MenaraSMI2026!'],
            'Référent HSE filiale' => ['Référent HSE', 'MenaraHSE2026!'],
            'Technicien terrain' => ['Technicien Terrain', 'MenaraTech2026!'],
            'Consultation Direction' => ['Direction Générale', 'MenaraDirection2026!'],
        ];
    }

    public function test_connexion_reussie_pour_chaque_role(): void
    {
        foreach (self::comptesSeedes() as $role => [$nom, $motDePasse]) {
            $this->browse(function (Browser $browser) use ($role, $nom, $motDePasse) {
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', $nom)
                    ->type('.login-label:nth-child(2) input', $motDePasse)
                    ->press('Se connecter')
                    ->waitUntilMissing('.login-page', 10)
                    ->assertPathIsNot('/login')
                    ->assertSee($role);
            });
        }
    }

    public function test_echec_connexion_mauvais_mot_de_passe(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'Administrateur')
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
                ->type('.login-label:nth-child(1) input', 'Personne Inconnue')
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
                ->type('.login-label:nth-child(1) input', 'Administrateur')
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
