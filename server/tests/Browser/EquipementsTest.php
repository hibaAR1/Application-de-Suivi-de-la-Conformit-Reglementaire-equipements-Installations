<?php

namespace Tests\Browser;

use App\Modules\TypeEquipement\TypeEquipement;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Création, visibilité des boutons Modifier/Supprimer selon permission
// (voir EquipementsListe.jsx : "Modifier" nécessite equipements.edit,
// "Supprimer" nécessite equipements.delete — voir PermissionSeeder.php pour
// qui a quoi), et suppression.
//
// Le tableau des équipements n'affiche ni la désignation ni le n° de série
// dans ses colonnes (seulement un code généré côté serveur, imprévisible à
// l'avance) : pour retrouver précisément la ligne créée par le test, on
// utilise la barre de recherche (qui filtre, elle, sur le n° de série) et on
// vérifie qu'elle isole une seule ligne, plutôt que de deviner le code.
class EquipementsTest extends DuskTestCase
{
    private function connecter(Browser $browser, string $email, string $motDePasse): void
    {
        $browser->visit('/login')
            ->type('.login-label:nth-child(1) input', $email)
            ->type('.login-label:nth-child(2) input', $motDePasse)
            ->press('Se connecter')
            ->waitUntilMissing('.login-page', 10);
    }

    /** Contourne les soucis classiques de saisie clavier sur <input type="date"> :
     *  on pose la valeur directement (via le vrai setter natif, pour que React
     *  la détecte) plutôt que de simuler des frappes clavier dépendantes de la
     *  locale du navigateur. */
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
            // Important : la liste se charge depuis le serveur de façon
            // asynchrone (on voit "Chargement..." pendant ce temps). Si on
            // tape dans la recherche avant la fin du chargement, le filtre
            // (qui est local, pas une requête réseau) s'applique sur une
            // liste encore vide → 0 résultat, alors que l'équipement existe
            // bien. On attend donc que "Chargement..." disparaisse d'abord.
            ->waitUntilMissingText('Chargement...', 10)
            ->type('input[placeholder^="Rechercher"]', $numeroSerie)
            ->pause(300); // le filtrage est local (pas de requête réseau), une courte pause suffit
    }

    public function test_creation_puis_visibilite_des_boutons_selon_permission_puis_suppression(): void
    {
        $numeroSerie = 'DUSK-'.uniqid();
        $typeTransformateur = TypeEquipement::where('libelle', 'Transformateur')->firstOrFail();

        $this->browse(function (Browser $browser) use ($numeroSerie, $typeTransformateur) {
            // 1. Le Super Admin crée l'équipement.
            $this->connecter($browser, 'admin@menara-holding.ma', 'MenaraAdmin2026!');

            $browser->visit('/equipements/nouveau')
                ->waitFor('#filiale', 10)
                // Les listes (filiales, types) se chargent de façon
                // asynchrone : on attend l'option avant de la choisir (même
                // souci que pour le <select> Rôle vu précédemment).
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

            // 2. On retrouve la ligne créée via la recherche (n° de série) et
            // on vérifie qu'elle est bien seule (le n° de série est unique).
            $this->chercher($browser, $numeroSerie);
            $lignes = $browser->elements('table tbody tr');
            $this->assertCount(1, $lignes, 'La recherche par n° de série devrait isoler une seule ligne.');

            // Super Admin a equipements.edit ET equipements.delete : les
            // deux boutons doivent être visibles sur cette ligne.
            $browser->assertVisible('table tbody tr button[title="Modifier"]')
                ->assertVisible('table tbody tr button[title="Supprimer"]');

            // 3. Le Technicien terrain n'a NI equipements.edit NI
            // equipements.delete (voir PermissionSeeder.php) : les deux
            // boutons doivent être absents sur cette même ligne.
            $this->connecter($browser, 'technicien.ctm@menara-holding.ma', 'MenaraTech2026!');
            $this->chercher($browser, $numeroSerie);
            $browser->assertMissing('table tbody tr button[title="Modifier"]')
                ->assertMissing('table tbody tr button[title="Supprimer"]');

            // 4. Retour au Super Admin pour nettoyer : suppression de
            // l'équipement de test.
            $this->connecter($browser, 'admin@menara-holding.ma', 'MenaraAdmin2026!');
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
