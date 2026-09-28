<?php

namespace Tests\Browser;

use App\Models\TypeEquipement;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class EquipementsTest extends DuskTestCase
{
    private function connecter(Browser $browser, string $nom, string $motDePasse): void
    {
        $browser->visit('/login')
            ->type('.login-label:nth-child(1) input', $nom)
            ->type('.login-label:nth-child(2) input', $motDePasse)
            ->press('Se connecter')
            ->waitUntilMissing('.login-page', 10);
    }

    private function remplirChampDate(Browser $browser, string $selecteur, string $valeurIso): void
    {
        $browser->script("
            const el = document.querySelector('{$selecteur}');
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, '{$valeurIso}');
            el.dispatchEvent(new Event('input', { bubbles: true }));
        ");
    }

    private function chercher(Browser $browser, string $numeroSerie): void
    {
        $browser->visit('/equipements')
            ->waitFor('input[placeholder^="Rechercher"]', 10)
            ->waitUntilMissingText('Chargement...', 10)
            ->type('input[placeholder^="Rechercher"]', $numeroSerie)
            ->pause(500);
    }

    public function test_creation_puis_visibilite_des_boutons_selon_permission_puis_suppression(): void
    {
        $numeroSerie = 'DUSK-'.uniqid();
        $typeTransformateur = TypeEquipement::where('libelle', 'Transformateur')->firstOrFail();

        $this->browse(function (Browser $browser) use ($numeroSerie, $typeTransformateur) {
            $this->connecter($browser, 'Administrateur', 'MenaraAdmin2026!');

            $browser->visit('/equipements/nouveau')
                ->waitFor('#filiale', 10)
                ->waitFor('#filiale option[value="CTM"]', 10)
                ->select('#filiale', 'CTM')
                ->waitFor('#type option[value="'.$typeTransformateur->id_type_equipement.'"]', 10)
                ->select('#type', (string) $typeTransformateur->id_type_equipement)
                ->type('#designation', 'Équipement Test Dusk')
                ->type('#serie', $numeroSerie)
                ->type('#periodicite', '12');

            $this->remplirChampDate($browser, '#mes', now()->format('Y-m-d'));

            $browser->press("Créer l'équipement")
                ->waitForLocation('/equipements', 10);

            $this->chercher($browser, $numeroSerie);
            $lignes = $browser->elements('table tbody tr');
            $this->assertCount(1, $lignes, 'La recherche par n° de série devrait isoler une seule ligne.');

            $browser->assertVisible('table tbody tr button[title="Modifier"]')
                ->assertVisible('table tbody tr button[title="Supprimer"]');

            $this->connecter($browser, 'Technicien Terrain', 'MenaraTech2026!');
            $this->chercher($browser, $numeroSerie);
            $browser->assertMissing('table tbody tr button[title="Modifier"]')
                ->assertMissing('table tbody tr button[title="Supprimer"]');

            $this->connecter($browser, 'Administrateur', 'MenaraAdmin2026!');
            $this->chercher($browser, $numeroSerie);
            $browser->click('table tbody tr button[title="Supprimer"]')
                ->waitForDialog(5)->acceptDialog()
                ->pause(1000);

            $this->chercher($browser, $numeroSerie);
            $lignesApres = $browser->elements('table tbody tr');
            $this->assertCount(0, $lignesApres, "L'équipement de test aurait dû disparaître après suppression.");
        });
    }
}
