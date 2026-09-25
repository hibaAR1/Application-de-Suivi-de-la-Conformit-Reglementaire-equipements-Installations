<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ConnexionTest extends DuskTestCase
{
    public function test_connexion_super_admin_mene_au_tableau_de_bord(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('input[type=email]', 'admin@menara-holding.ma')
                ->type('input[type=password]', 'MenaraAdmin2026!')
                ->press('Se connecter')
                ->waitForLocation('/', 10)
                ->assertPathIs('/')
                ->assertSee('Tableau de bord');
        });
    }
}
