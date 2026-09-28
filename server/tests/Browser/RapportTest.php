<?php

namespace Tests\Browser;

use App\Models\Equipement;
use App\Models\Filiale;
use App\Models\Rapport;
use App\Models\Site;
use App\Models\TypeEquipement;
use Facebook\WebDriver\WebDriverBy;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Onglet "Rapports" de la fiche équipement (bouton "Ouvrir" → EquipementModal
// → onglet Rapports, voir OngletRapports() dans EquipementModal.jsx) :
// ajout d'un rapport et la permission requise (equipements.edit — voir
// routes/api.php) pour en ajouter un.
//
// Le champ PDF n'est PAS testé ici : le dépôt de fichier ne fonctionne pas
// de façon fiable via l'automatisation du navigateur sur ce poste (testé en
// headless et en fenêtre visible, avec plusieurs techniques — probablement
// une histoire de version Chrome/ChromeDriver locale, pas un bug de
// l'application). Le fichier étant optionnel côté formulaire, on teste tout
// le reste (date, organisme, référence, constatations) sans lui.
class RapportTest extends DuskTestCase
{
    private function connecter(Browser $browser, string $nom, string $motDePasse): void
    {
        $browser->visit('/login')
            ->type('.login-label:nth-child(1) input', $nom)
            ->type('.login-label:nth-child(2) input', $motDePasse)
            ->press('Se connecter')
            ->waitUntilMissing('.login-page', 20);
    }

    /** Ouvre la fiche du premier (et seul, grâce à la recherche) équipement affiché. */
    private function ouvrirFiche(Browser $browser, string $numeroSerie): void
    {
        $browser->visit('/equipements')
            ->waitFor('input[placeholder^="Rechercher"]', 10)
            ->waitUntilMissingText('Chargement...', 10)
            ->type('input[placeholder^="Rechercher"]', $numeroSerie)
            ->pause(300)
            ->waitFor('table tbody tr button.btn-primary', 10)
            ->click('table tbody tr button.btn-primary')
            ->waitForText('Informations', 10);
    }

    private function creerEquipementDeTest(string $numeroSerie): Equipement
    {
        $filiale = Filiale::where('code', 'CTM')->firstOrFail();
        $site = Site::where('id_filiale', $filiale->id_filiale)->where('code', '201')->firstOrFail();
        $type = TypeEquipement::where('libelle', 'Transformateur')->firstOrFail();

        return Equipement::create([
            'id_equipement' => 'RAPPORT-TEST-001',
            'referentiel' => 'RAPPORT-TEST-001',
            'statut' => 'Conforme',
            'id_filiale' => $filiale->id_filiale,
            'id_site' => $site->id_site,
            'id_type_equipement' => $type->id_type_equipement,
            'designation' => 'Équipement Test Rapport',
            'numero_serie' => $numeroSerie,
            'date_mise_en_service' => '2026-01-01',
        ]);
    }

    public function test_ajout_dun_rapport(): void
    {
        $numeroSerie = 'SN-RAPPORT-'.uniqid();
        $equipement = $this->creerEquipementDeTest($numeroSerie);
        $organisme = 'SOCOTEC Dusk '.uniqid();

        try {
            $this->browse(function (Browser $browser) use ($numeroSerie, $organisme) {
                $this->connecter($browser, 'Administrateur', 'MenaraAdmin2026!');
                $this->ouvrirFiche($browser, $numeroSerie);

                $browser->driver->findElement(
                    WebDriverBy::xpath("//button[contains(normalize-space(.), 'Rapports')]")
                )->click();

                $browser->waitForText('Aucun rapport enregistré', 10)
                    ->press('+ Ajouter un rapport')
                    ->waitFor('input[type="date"]', 10);

                // <input type="date"> : on pose la valeur directement (setter
                // natif) plutôt que de simuler des frappes clavier — même
                // technique que dans EquipementsTest.php.
                $browser->script("
                    const el = document.querySelector('input[type=\"date\"]');
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(el, '2026-03-15');
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                ");

                $browser->type('input[placeholder="SOCOTEC, VERITAS..."]', $organisme)
                    ->type('input[placeholder="VT-2024-1234"]', 'REF-DUSK-01')
                    ->type('textarea', 'Constatations de test Dusk.')
                    ->press('Enregistrer')
                    ->waitUntilMissingText('Aucun rapport enregistré', 10)
                    ->assertSee($organisme)
                    ->assertSee('REF-DUSK-01')
                    ->assertSee('Constatations de test Dusk.')
                    // Le compteur dans l'onglet doit refléter le nouveau total.
                    ->assertSee('Rapports (1)');
            });

            $this->assertTrue(
                Rapport::where('organisme', $organisme)->exists(),
                "Le rapport ajouté n'a pas été trouvé en base."
            );
        } finally {
            Rapport::where('id_equipement', $equipement->id_equipement)->delete();
            $equipement->delete();
        }
    }

    // equipements.edit est requis côté serveur pour ajouter un rapport (voir
    // routes/api.php) — le formulaire n'est pas caché selon le rôle côté
    // écran, donc c'est bien le serveur qui doit bloquer ici.
    public function test_ajout_dun_rapport_refuse_sans_la_permission(): void
    {
        $numeroSerie = 'SN-RAPPORT-REFUS-'.uniqid();
        $equipement = $this->creerEquipementDeTest($numeroSerie);

        try {
            $this->browse(function (Browser $browser) use ($numeroSerie) {
                // Technicien terrain a equipements.view mais PAS equipements.edit.
                $this->connecter($browser, 'Technicien Terrain', 'MenaraTech2026!');
                $this->ouvrirFiche($browser, $numeroSerie);

                $browser->driver->findElement(
                    WebDriverBy::xpath("//button[contains(normalize-space(.), 'Rapports')]")
                )->click();

                $browser->waitFor('.btn-secondary', 10)
                    ->press('+ Ajouter un rapport')
                    ->waitFor('input[type="date"]', 10);

                $browser->script("
                    const el = document.querySelector('input[type=\"date\"]');
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(el, '2026-03-15');
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                ");

                $browser->type('input[placeholder="SOCOTEC, VERITAS..."]', 'Organisme Refusé')
                    ->press('Enregistrer')
                    ->waitForText('Action non autorisée', 15)
                    ->assertSee('Action non autorisée : permission requise.');
            });

            $this->assertFalse(
                Rapport::where('organisme', 'Organisme Refusé')->exists(),
                "Un rapport a été créé malgré l'absence de la permission equipements.edit."
            );
        } finally {
            Rapport::where('id_equipement', $equipement->id_equipement)->delete();
            $equipement->delete();
        }
    }
}
