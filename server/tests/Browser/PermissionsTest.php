<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Vérifie que les pages "Utilisateurs" et "Rôles & Permissions" — réservées
// à la permission utilisateurs.manage (voir RolesAdmin.jsx / Utilisateurs.jsx
// et le middleware côté routes/api.php) — sont bien cachées dans le menu ET
// bloquées ("Accès refusé") pour les rôles qui n'ont pas cette permission,
// et bien accessibles pour ceux qui l'ont (voir PermissionSeeder.php).
class PermissionsTest extends DuskTestCase
{
    /**
     * @return array<string, array{0: string, 1: string, 2: bool}>
     *   [nom, mot de passe, a le droit utilisateurs.manage ?]
     */
    public static function comptesEtDroits(): array
    {
        return [
            'Super Admin (a le droit)' => ['Administrateur', 'MenaraAdmin2026!', true],
            'Administrateur SMI Holding (a le droit)' => ['Responsable SMI', 'MenaraSMI2026!', true],
            "Référent HSE filiale (n'a PAS le droit)" => ['Référent HSE', 'MenaraHSE2026!', false],
            "Technicien terrain (n'a PAS le droit)" => ['Technicien Terrain', 'MenaraTech2026!', false],
            "Consultation Direction (n'a PAS le droit)" => ['Direction Générale', 'MenaraDirection2026!', false],
        ];
    }

    public function test_acces_utilisateurs_et_roles_selon_la_permission(): void
    {
        foreach (self::comptesEtDroits() as [$nom, $motDePasse, $autorise]) {
            $this->browse(function (Browser $browser) use ($nom, $motDePasse, $autorise) {
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', $nom)
                    ->type('.login-label:nth-child(2) input', $motDePasse)
                    ->press('Se connecter')
                    // Délai généreux (20s) : ce test se connecte 5 fois de
                    // suite (un compte par rôle) dans la même méthode, et
                    // plusieurs tests Dusk qui tournent à la suite peuvent
                    // ralentir la machine.
                    ->waitUntilMissing('.login-page', 20);

                if ($autorise) {
                    $browser->assertSeeLink('Utilisateurs')
                        ->assertSeeLink('Rôles & Permissions')
                        ->visit('/utilisateurs')
                        ->waitFor('.topbar', 10)
                        ->assertDontSee('Accès refusé')
                        ->visit('/roles')
                        ->waitFor('.topbar', 10)
                        ->assertDontSee('Accès refusé');
                } else {
                    $browser->assertDontSeeLink('Utilisateurs')
                        ->assertDontSeeLink('Rôles & Permissions')
                        // Même sans le lien dans le menu, l'accès direct par
                        // URL doit rester bloqué (sécurité côté écran) — et
                        // l'API elle-même est protégée en plus (voir
                        // routes/api.php : ->middleware('permission:utilisateurs.manage')).
                        ->visit('/utilisateurs')
                        ->waitForText('Accès refusé', 10)
                        ->visit('/roles')
                        ->waitForText('Accès refusé', 10);
                }
            });
        }
    }
}
