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
     *   [email, mot de passe, a le droit utilisateurs.manage ?]
     */
    public static function comptesEtDroits(): array
    {
        return [
            'Super Admin (a le droit)' => ['admin@menara-holding.ma', 'MenaraAdmin2026!', true],
            'Administrateur SMI Holding (a le droit)' => ['smi@menara-holding.ma', 'MenaraSMI2026!', true],
            "Référent HSE filiale (n'a PAS le droit)" => ['hse.ctm@menara-holding.ma', 'MenaraHSE2026!', false],
            "Technicien terrain (n'a PAS le droit)" => ['technicien.ctm@menara-holding.ma', 'MenaraTech2026!', false],
            "Consultation Direction (n'a PAS le droit)" => ['direction@menara-holding.ma', 'MenaraDirection2026!', false],
        ];
    }

    public function test_acces_utilisateurs_et_roles_selon_la_permission(): void
    {
        foreach (self::comptesEtDroits() as [$email, $motDePasse, $autorise]) {
            $this->browse(function (Browser $browser) use ($email, $motDePasse, $autorise) {
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', $email)
                    ->type('.login-label:nth-child(2) input', $motDePasse)
                    ->press('Se connecter')
                    ->waitUntilMissing('.login-page', 10);

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
