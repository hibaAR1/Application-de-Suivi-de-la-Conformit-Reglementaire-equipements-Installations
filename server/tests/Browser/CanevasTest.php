<?php

namespace Tests\Browser;

use Illuminate\Support\Facades\Http;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use ZipArchive;

// Le bouton "Canevas" (page Équipements) télécharge un classeur .xlsx vierge
// avec les bons en-têtes de colonnes et de vraies listes déroulantes Excel
// (Filiale/Site/Type/Statut) — voir excelEquipements.js. On vérifie que le
// fichier est bien téléchargé et qu'il contient les bonnes colonnes, en
// lisant directement le XML interne du .xlsx (un .xlsx est un .zip), sans
// dépendance PHP supplémentaire.
class CanevasTest extends DuskTestCase
{
    // Chrome en mode headless bloque les téléchargements par défaut (sécurité) :
    // il faut l'autoriser explicitement pour cette session de navigateur, en
    // parlant directement au driver Chrome (commande non standard, propre à
    // ChromeDriver, PAS une commande WebDriver classique).
    private function autoriserTelechargements(Browser $browser, string $dossier): void
    {
        $sessionId = $browser->driver->getSessionID();
        $reponse = Http::post("http://localhost:9515/session/{$sessionId}/chromium/send_command", [
            'cmd' => 'Browser.setDownloadBehavior',
            'params' => [
                'behavior' => 'allow',
                'downloadPath' => $dossier,
            ],
        ]);

        if (! $reponse->successful()) {
            throw new \RuntimeException(
                "Impossible d'autoriser les téléchargements (code {$reponse->status()}) : ".$reponse->body()
            );
        }
    }
    public function test_telechargement_du_canevas_equipements(): void
    {
        $cheminFichier = static::downloadsPath('canevas-equipements.xlsx');
        // Nettoie un éventuel fichier d'un run précédent, pour ne pas
        // vérifier par erreur un vieux fichier au lieu du nouveau.
        if (file_exists($cheminFichier)) {
            unlink($cheminFichier);
        }

        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                ->type('.login-label:nth-child(1) input', 'Administrateur')
                ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
                ->press('Se connecter')
                ->waitUntilMissing('.login-page', 20);

            $this->autoriserTelechargements($browser, static::downloadsPath());

            $browser->visit('/equipements')
                ->waitFor('.topbar', 10)
                ->press('Canevas');
        });

        // Le téléchargement se fait côté navigateur (pas de navigation, pas
        // de texte qui change à l'écran) : on attend l'apparition du fichier
        // lui-même sur le disque, jusqu'à 10 secondes.
        $tentatives = 0;
        while (! file_exists($cheminFichier) && $tentatives < 20) {
            usleep(500_000);
            $tentatives++;
        }

        $this->assertFileExists($cheminFichier, "Le fichier canevas-equipements.xlsx n'a pas été téléchargé.");

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($cheminFichier) === true, "Le fichier téléchargé ne semble pas être un .xlsx valide.");
        $texteBrut = $zip->getFromName('xl/sharedStrings.xml') ?: '';
        $zip->close();

        foreach (['Filiale', 'Site', 'Type', 'Numero_Serie', 'Date_Mise_En_Service', 'Statut'] as $colonne) {
            $this->assertStringContainsString($colonne, $texteBrut, "La colonne \"{$colonne}\" est absente du canevas téléchargé.");
        }
    }
}
