<?php

namespace Tests\Browser;

use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Facebook\WebDriver\WebDriverBy;
use Illuminate\Support\Facades\Hash;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Gestion des rôles (RolesAdmin.jsx / RoleModal.jsx) et des utilisateurs
// (Utilisateurs.jsx / UtilisateurForm.jsx) : création, et suppression — y
// compris le cas bloqué (rôle encore attribué à un utilisateur, voir
// RoleController::destroy qui intercepte la contrainte de clé étrangère).
//
// Les boutons "Supprimer" n'ont pas d'identifiant unique dans le HTML (même
// bouton répété par ligne/carte) : on les cible précisément via XPath, en
// remontant depuis un texte unique à la ligne (l'email ou le nom du rôle de
// test) pour ne JAMAIS risquer de cliquer sur la mauvaise ligne — donc
// jamais sur un compte réel de l'appli.
class RolesEtUtilisateursTest extends DuskTestCase
{
    private function connecterSuperAdmin(Browser $browser): void
    {
        $browser->visit('/login')
            ->type('.login-label:nth-child(1) input', 'admin@menara-holding.ma')
            ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
            ->press('Se connecter')
            ->waitUntilMissing('.login-page', 10);
    }

    /** Clique un bouton "Supprimer" (title="Supprimer") dans la carte de rôle contenant $texteRepere. */
    private function supprimerCarteRole(Browser $browser, string $texteRepere): void
    {
        $xpath = "//div[contains(@class,'plate')][contains(., \"{$texteRepere}\")]//button[@title=\"Supprimer\"]";
        $browser->driver->findElement(WebDriverBy::xpath($xpath))->click();
        $browser->waitForDialog(5)->acceptDialog();
    }

    /** Clique le bouton "Supprimer" (texte) dans la ligne de tableau contenant $texteRepere. */
    private function supprimerLigneUtilisateur(Browser $browser, string $texteRepere): void
    {
        $xpath = "//tr[contains(., \"{$texteRepere}\")]//button[contains(text(),'Supprimer')]";
        $browser->driver->findElement(WebDriverBy::xpath($xpath))->click();
        $browser->waitForDialog(5)->acceptDialog();
    }

    public function test_creation_et_suppression_dun_role_inutilise(): void
    {
        $nomRole = 'Auditeur Externe Dusk '.uniqid();

        $this->browse(function (Browser $browser) use ($nomRole) {
            $this->connecterSuperAdmin($browser);

            $browser->visit('/roles')
                ->waitFor('.btn-primary', 10)
                ->press('+ Nouveau rôle')
                ->waitFor('.field', 10)
                ->type('.field:nth-of-type(1) input', $nomRole)
                ->type('.field:nth-of-type(2) input', 'Rôle créé par le test Dusk automatique.')
                ->press('Créer le rôle')
                // .plate est aussi la classe du panneau "Chargement..." : on
                // attend le TEXTE du nouveau rôle, pas juste une carte
                // quelconque, sinon on vérifie la page avant qu'elle ait
                // fini de se recharger.
                ->waitForText($nomRole, 10)
                ->assertSee('0 permission(s) accordée(s)');

            $this->supprimerCarteRole($browser, $nomRole);
            // Laisse le temps à la liste de se recharger après la suppression
            // (d'autres cartes .plate restent affichées, donc pas de
            // waitUntilMissing possible ici).
            $browser->pause(1000)->assertDontSee($nomRole);
        });

        // Filet de sécurité si l'assertion a échoué avant la suppression UI.
        Role::where('libelle', $nomRole)->delete();
    }

    public function test_suppression_dun_role_encore_attribue_est_bloquee(): void
    {
        $nomRole = 'Rôle Dusk Temporaire '.uniqid();
        $role = Role::create(['libelle' => $nomRole, 'description' => 'Test Dusk']);
        $utilisateur = Utilisateur::create([
            'nom' => 'Titulaire Rôle Dusk',
            'email' => 'dusk.titulaire.'.uniqid().'@menara-holding.ma',
            'mot_de_passe' => Hash::make('PeuImporte123'),
            'id_role' => $role->id_role,
            'actif' => true,
            'doit_changer_mot_passe' => false,
        ]);

        try {
            $this->browse(function (Browser $browser) use ($nomRole) {
                $this->connecterSuperAdmin($browser);
                $browser->visit('/roles')
                    ->waitForText($nomRole, 10);

                $this->supprimerCarteRole($browser, $nomRole);

                $browser->waitForText('Impossible de supprimer', 10)
                    ->assertSee('des utilisateurs ont encore ce rôle')
                    // Le rôle doit toujours être dans la liste : pas supprimé.
                    ->assertSee($nomRole);
            });
        } finally {
            $utilisateur->delete();
            $role->delete();
        }
    }

    public function test_creation_et_suppression_dun_utilisateur(): void
    {
        $email = 'dusk.utilisateur.'.uniqid().'@menara-holding.ma';
        $roleDirection = Role::where('libelle', 'Consultation Direction')->firstOrFail();

        try {
            $this->browse(function (Browser $browser) use ($email, $roleDirection) {
                $this->connecterSuperAdmin($browser);

                $browser->visit('/utilisateurs/nouveau')
                    ->waitFor('.field', 10)
                    ->type('.field:nth-of-type(1) input', 'Utilisateur Test Dusk')
                    ->type('.field:nth-of-type(2) input', $email)
                    ->type('.field:nth-of-type(3) input', 'MotDePasseDusk123')
                    // La liste des rôles se charge de façon asynchrone (appel
                    // API séparé) : on attend que l'option existe vraiment
                    // dans le <select> avant de la choisir, sinon select()
                    // ne trouve rien et le champ (obligatoire) reste vide.
                    ->waitFor('.field:nth-of-type(4) select option[value="'.$roleDirection->id_role.'"]', 10)
                    ->select('.field:nth-of-type(4) select', (string) $roleDirection->id_role)
                    ->press('Enregistrer')
                    ->waitForLocation('/utilisateurs', 10)
                    // La liste des utilisateurs se recharge elle aussi de
                    // façon asynchrone après la navigation : on attend le
                    // texte, pas juste l'URL.
                    ->waitForText($email, 10);

                $this->supprimerLigneUtilisateur($browser, $email);
                $browser->pause(1000)->assertDontSee($email);
            });
        } finally {
            // Filet de sécurité si l'assertion a échoué avant la suppression UI.
            Utilisateur::where('email', $email)->delete();
        }
    }
}
