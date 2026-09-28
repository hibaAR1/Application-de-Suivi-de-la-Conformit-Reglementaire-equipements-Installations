<?php

namespace Tests\Browser;

use App\Models\Equipement;
use App\Models\Filiale;
use App\Models\GroupeEquipement;
use App\Models\Site;
use App\Models\TypeEquipement;
use Facebook\WebDriver\WebDriverBy;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// "Données de base" (Groupes + Types d'équipement, voir DonneesBase.jsx,
// GroupesEquipementAdmin.jsx, TypesEquipementAdmin.jsx) : création,
// modification, suppression (y compris le cas bloqué d'un type encore
// utilisé), et la permission d'accès à ces deux pages. Pas de pages
// "Filiales"/"Sites" ici : elles n'ont pas d'écran de gestion dans
// l'application (voir App.jsx — seules /donnees-base/groupes et
// /donnees-base/types existent).
class DonneesBaseTest extends DuskTestCase
{
    private function connecter(Browser $browser, string $nom, string $motDePasse): void
    {
        $browser->visit('/login')
            ->type('.login-label:nth-child(1) input', $nom)
            ->type('.login-label:nth-child(2) input', $motDePasse)
            ->press('Se connecter')
            ->waitUntilMissing('.login-page', 20);
    }

    private function connecterSuperAdmin(Browser $browser): void
    {
        $this->connecter($browser, 'Administrateur', 'MenaraAdmin2026!');
    }

    /** Clique un bouton (title=$titre) dans la carte contenant $texteRepere. */
    private function cliquerDansCarte(Browser $browser, string $texteRepere, string $titre): void
    {
        $xpath = "//div[contains(@class,'plate')][contains(., \"{$texteRepere}\")]//button[@title=\"{$titre}\"]";
        $browser->driver->findElement(WebDriverBy::xpath($xpath))->click();
    }

    public function test_creation_modification_et_suppression_dun_groupe(): void
    {
        $nom = 'Groupe Dusk '.uniqid();
        $nomModifie = 'Groupe Dusk Modifié '.uniqid();

        $this->browse(function (Browser $browser) use ($nom, $nomModifie) {
            $this->connecterSuperAdmin($browser);

            $browser->visit('/donnees-base/groupes')
                ->waitFor('.btn-primary', 10)
                ->press('+ Nouveau groupe')
                ->waitFor('.field input', 10)
                ->type('.field input', $nom)
                ->press('Créer le groupe')
                ->waitForText($nom, 20);

            $this->cliquerDansCarte($browser, $nom, 'Modifier');
            $browser->waitFor('.field input', 10)
                ->clear('.field input')
                ->type('.field input', $nomModifie)
                ->press('Enregistrer')
                ->waitForText($nomModifie, 20)
                ->assertDontSee($nom);

            $this->cliquerDansCarte($browser, $nomModifie, 'Supprimer');
            $browser->waitForDialog(5)->acceptDialog();
            $browser->waitUntilMissingText($nomModifie, 10)
                ->assertDontSee($nomModifie);
        });

        // Filet de sécurité si une étape a échoué avant la suppression UI.
        GroupeEquipement::whereIn('libelle', [$nom, $nomModifie])->delete();
    }

    public function test_creation_modification_et_suppression_dun_type_equipement(): void
    {
        $nom = 'Type Dusk '.uniqid();
        $nomModifie = 'Type Dusk Modifié '.uniqid();

        $this->browse(function (Browser $browser) use ($nom, $nomModifie) {
            $this->connecterSuperAdmin($browser);

            $browser->visit('/donnees-base/types')
                ->waitFor('.btn-primary', 10)
                ->press('+ Nouveau type')
                ->waitFor('.field input[placeholder^="ex: Groupe"]', 10)
                ->type('.field input[placeholder^="ex: Groupe"]', $nom)
                ->type('.field input[type="number"]', '6')
                ->press('Créer le type')
                ->waitForText($nom, 20)
                ->assertSee('Périodicité : 6 mois');

            $this->cliquerDansCarte($browser, $nom, 'Modifier');
            $browser->waitFor('.field input[placeholder^="ex: Groupe"]', 10)
                ->clear('.field input[placeholder^="ex: Groupe"]')
                ->type('.field input[placeholder^="ex: Groupe"]', $nomModifie)
                ->clear('.field input[type="number"]')
                ->type('.field input[type="number"]', '9')
                ->press('Enregistrer')
                ->waitForText($nomModifie, 20)
                ->assertSee('Périodicité : 9 mois')
                ->assertDontSee($nom);

            $this->cliquerDansCarte($browser, $nomModifie, 'Supprimer');
            $browser->waitForDialog(5)->acceptDialog();
            $browser->waitUntilMissingText($nomModifie, 10)
                ->assertDontSee($nomModifie);
        });

        // Filet de sécurité si une étape a échoué avant la suppression UI.
        TypeEquipement::whereIn('libelle', [$nom, $nomModifie])->delete();
    }

    // Contrainte de clé étrangère : un type encore utilisé par un équipement
    // ne doit pas pouvoir être supprimé (voir TypeEquipementController::destroy).
    public function test_suppression_dun_type_encore_utilise_est_bloquee(): void
    {
        $nomType = 'Type Dusk Utilisé '.uniqid();
        $type = TypeEquipement::create([
            'libelle' => $nomType,
            'categorie' => 'Fixe',
            'periodicite_controle' => 12,
        ]);

        $filiale = Filiale::where('code', 'CTM')->firstOrFail();
        $site = Site::where('id_filiale', $filiale->id_filiale)->where('code', '201')->firstOrFail();
        $equipement = Equipement::create([
            'id_equipement' => 'DONBASE-TEST-001',
            'referentiel' => 'DONBASE-TEST-001',
            'statut' => 'Conforme',
            'id_filiale' => $filiale->id_filiale,
            'id_site' => $site->id_site,
            'id_type_equipement' => $type->id_type_equipement,
            'designation' => 'Équipement Test Données de base',
            'numero_serie' => 'SN-DONBASE-'.uniqid(),
            'date_mise_en_service' => '2026-01-01',
        ]);

        try {
            $this->browse(function (Browser $browser) use ($nomType) {
                $this->connecterSuperAdmin($browser);

                $browser->visit('/donnees-base/types')
                    ->waitForText($nomType, 10);

                $this->cliquerDansCarte($browser, $nomType, 'Supprimer');
                $browser->waitForDialog(5)->acceptDialog();

                $browser->waitForText('Impossible de supprimer', 10)
                    ->assertSee('des équipements utilisent encore ce type')
                    // Le type doit toujours être dans la liste : pas supprimé.
                    ->assertSee($nomType);
            });
        } finally {
            $equipement->delete();
            $type->delete();
        }
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: bool}>
     *   [nom, mot de passe, a le droit d'accéder à Données de base ?]
     */
    public static function comptesEtDroits(): array
    {
        return [
            'Super Admin (a le droit)' => ['Administrateur', 'MenaraAdmin2026!', true],
            'Administrateur SMI Holding (a le droit)' => ['Responsable SMI', 'MenaraSMI2026!', true],
            // A equipements.create, donc autorisé même sans utilisateurs.manage.
            'Référent HSE filiale (a le droit)' => ['Référent HSE', 'MenaraHSE2026!', true],
            "Technicien terrain (n'a PAS le droit)" => ['Technicien Terrain', 'MenaraTech2026!', false],
            "Consultation Direction (n'a PAS le droit)" => ['Direction Générale', 'MenaraDirection2026!', false],
        ];
    }

    public function test_acces_donnees_de_base_selon_la_permission(): void
    {
        foreach (self::comptesEtDroits() as [$nom, $motDePasse, $autorise]) {
            $this->browse(function (Browser $browser) use ($nom, $motDePasse, $autorise) {
                $this->connecter($browser, $nom, $motDePasse);

                if ($autorise) {
                    $browser->visit('/donnees-base/groupes')
                        ->waitFor('.topbar', 10)
                        ->assertDontSee('Accès refusé')
                        ->visit('/donnees-base/types')
                        ->waitFor('.topbar', 10)
                        ->assertDontSee('Accès refusé');
                } else {
                    $browser->visit('/donnees-base/groupes')
                        ->waitForText('Accès refusé', 15)
                        ->visit('/donnees-base/types')
                        ->waitForText('Accès refusé', 15);
                }
            });
        }
    }
}
