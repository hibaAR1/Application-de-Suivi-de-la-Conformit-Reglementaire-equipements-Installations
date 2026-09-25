<?php

namespace Tests\Browser;

use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Couvre la page /changer-mot-de-passe : la validation "confirmation ne
// correspond pas", et le scénario complet "premier login obligatoire"
// (ChangerMotDePasse.jsx + ProtectedRoute.jsx + AuthController::changerMotDePasse).
//
// Remarque : le cas "nouveau mot de passe trop court" est déjà bloqué par
// l'attribut HTML minLength=8 du champ avant même que le JavaScript ne
// s'exécute (double protection) — un test Dusk fiable dessus demanderait de
// vérifier la validation native du navigateur plutôt que le message
// d'erreur affiché par l'appli, donc volontairement non automatisé ici.
class ChangementMotDePasseTest extends DuskTestCase
{
    public function test_confirmation_qui_ne_correspond_pas_est_refusee(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'admin@menara-holding.ma')
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
                // Le mot de passe de l'admin ne doit PAS avoir changé : on
                // reste bloqué sur le formulaire, jamais envoyé à l'API.
                ->assertPathIs('/changer-mot-de-passe');
        });
    }

    /**
     * Scénario complet : un Super Admin crée un utilisateur -> celui-ci doit
     * changer son mot de passe temporaire dès sa première connexion -> tant
     * qu'il ne l'a pas fait, toute autre page redirige vers
     * /changer-mot-de-passe -> une fois changé, il accède normalement au
     * reste de l'appli.
     */
    public function test_nouvel_utilisateur_doit_changer_son_mot_de_passe_a_la_premiere_connexion(): void
    {
        $email = 'dusk.test.'.uniqid().'@menara-holding.ma';
        $motDePasseTemporaire = 'MotDePasseTemp123';
        $motDePasseDefinitif = 'MotDePasseDefinitif456';
        $roleTechnicien = Role::where('libelle', 'Technicien terrain')->firstOrFail();

        try {
            $this->browse(function (Browser $browser) use ($email, $motDePasseTemporaire, $motDePasseDefinitif, $roleTechnicien) {
                // 1. Le Super Admin crée le compte.
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', 'admin@menara-holding.ma')
                    ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
                    ->press('Se connecter')
                    ->waitUntilMissing('.login-page', 10)
                    ->visit('/utilisateurs/nouveau')
                    ->waitFor('.field', 10)
                    ->type('.field:nth-of-type(1) input', 'Test Dusk Utilisateur')
                    ->type('.field:nth-of-type(2) input', $email)
                    ->type('.field:nth-of-type(3) input', $motDePasseTemporaire)
                    // La liste des rôles se charge de façon asynchrone : on
                    // attend que l'option existe avant de la choisir, sinon
                    // select() ne trouve rien et le champ (obligatoire) reste
                    // vide, ce qui bloque silencieusement la validation du
                    // formulaire (Enregistrer ne fait alors rien).
                    ->waitFor('.field:nth-of-type(4) select option[value="'.$roleTechnicien->id_role.'"]', 10)
                    ->select('.field:nth-of-type(4) select', (string) $roleTechnicien->id_role)
                    ->press('Enregistrer')
                    ->waitForLocation('/utilisateurs', 10)
                    // La liste des utilisateurs se recharge elle aussi de
                    // façon asynchrone après la navigation : on attend le
                    // texte, pas juste l'URL.
                    ->waitForText($email, 10);

                // 2. Déconnexion, puis connexion avec le nouveau compte.
                $browser->click('button[title="Se déconnecter"]')
                    ->waitForLocation('/login', 10)
                    ->type('.login-label:nth-child(1) input', $email)
                    ->type('.login-label:nth-child(2) input', $motDePasseTemporaire)
                    ->press('Se connecter')
                    ->waitForLocation('/changer-mot-de-passe', 10)
                    ->assertPathIs('/changer-mot-de-passe');

                // 3. Tant que le mot de passe n'est pas changé, impossible
                // d'accéder à une autre page : on est renvoyé de force ici.
                $browser->visit('/equipements')
                    ->waitForLocation('/changer-mot-de-passe', 10)
                    ->assertPathIs('/changer-mot-de-passe');

                // 4. Change le mot de passe -> accès normal au reste de l'appli.
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
            // Nettoyage : on ne laisse pas ce compte de test dans la base.
            Utilisateur::where('email', $email)->delete();
        }
    }
}
