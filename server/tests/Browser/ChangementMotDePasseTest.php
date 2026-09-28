<?php

namespace Tests\Browser;

use App\Models\Role;
use App\Models\Utilisateur;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ChangementMotDePasseTest extends DuskTestCase
{
    public function test_confirmation_qui_ne_correspond_pas_est_refusee(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'Administrateur')
                ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
                ->press('Se connecter')
                ->waitUntilMissing('.login-page', 10)
                ->visit('/changer-mot-de-passe')
                ->waitFor('.login-form', 10)
                ->type('.login-label:nth-child(1) input', 'MenaraAdmin2026!')
                ->type('.login-label:nth-child(2) input', 'NouveauMotDePasse123')
                ->type('.login-label:nth-child(3) input', 'UneAutreValeur123')
                ->press('Valider le nouveau mot de passe')
                ->waitFor('.login-error', 10)
                ->assertSee('ne correspond pas')
                ->assertPathIs('/changer-mot-de-passe');
        });
    }

    public function test_nouvel_utilisateur_doit_changer_son_mot_de_passe_a_la_premiere_connexion(): void
    {
        $nom = 'Test Dusk Utilisateur '.uniqid();
        $email = 'dusk.test.'.uniqid().'@menara-holding.ma';
        $motDePasseTemporaire = 'MotDePasseTemp123';
        $motDePasseDefinitif = 'MotDePasseDefinitif456';
        $roleTechnicien = Role::where('libelle', 'Technicien terrain')->firstOrFail();

        try {
            $this->browse(function (Browser $browser) use ($nom, $email, $motDePasseTemporaire, $motDePasseDefinitif, $roleTechnicien) {
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', 'Administrateur')
                    ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
                    ->press('Se connecter')
                    ->waitUntilMissing('.login-page', 10)
                    ->visit('/utilisateurs/nouveau')
                    ->waitFor('.field', 10)
                    ->type('.field:nth-of-type(1) input', $nom)
                    ->type('.field:nth-of-type(2) input', $email)
                    ->type('.field:nth-of-type(3) input', $motDePasseTemporaire)
                    ->waitFor('.field:nth-of-type(4) select option[value="'.$roleTechnicien->id_role.'"]', 10)
                    ->select('.field:nth-of-type(4) select', (string) $roleTechnicien->id_role)
                    ->press('Enregistrer')
                    ->waitForLocation('/utilisateurs', 10)
                    ->waitForText($email, 10);

                $browser->click('button[title="Se déconnecter"]')
                    ->waitForLocation('/login', 10)
                    ->type('.login-label:nth-child(1) input', $nom)
                    ->type('.login-label:nth-child(2) input', $motDePasseTemporaire)
                    ->press('Se connecter')
                    ->waitForLocation('/changer-mot-de-passe', 10)
                    ->assertPathIs('/changer-mot-de-passe');

                $browser->visit('/equipements')
                    ->waitForLocation('/changer-mot-de-passe', 10)
                    ->assertPathIs('/changer-mot-de-passe');

                $browser->type('.login-label:nth-child(1) input', $motDePasseTemporaire)
                    ->type('.login-label:nth-child(2) input', $motDePasseDefinitif)
                    ->type('.login-label:nth-child(3) input', $motDePasseDefinitif)
                    ->press('Valider le nouveau mot de passe')
                    ->waitForLocation('/', 10)
                    ->visit('/equipements')
                    ->waitUntilMissing('.login-page', 10)
                    ->assertPathIs('/equipements');
            });
        } finally {
            Utilisateur::where('email', $email)->delete();
        }
    }
}
