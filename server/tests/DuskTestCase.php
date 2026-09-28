<?php

namespace Tests;

use Facebook\WebDriver\Chrome\ChromeOptions;
use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\Remote\RemoteWebDriver;
use Illuminate\Support\Collection;
use Laravel\Dusk\TestCase as BaseTestCase;
use PHPUnit\Framework\Attributes\BeforeClass;

abstract class DuskTestCase extends BaseTestCase
{
    // Dossier où Chrome enregistre les fichiers téléchargés pendant les
    // tests (ex : le "Canevas" Excel téléchargé depuis Équipements) — pour
    // que les tests puissent ensuite ouvrir et vérifier le fichier reçu.
      // Dossier où Chrome enregistre les fichiers téléchargés pendant les
    // tests (ex : le "Canevas" Excel téléchargé depuis Équipements) — pour
    // que les tests puissent ensuite ouvrir et vérifier le fichier reçu.
    public static function downloadsPath(string $path = ''): string
    {
        // realpath() force un chemin propre et cohérent (que des "\" sous
        // Windows) — un chemin mélangeant "/" et "\" peut être refusé en
        // silence par Chrome pour download.default_directory.
        $base = realpath(__DIR__.DIRECTORY_SEPARATOR.'Browser'.DIRECTORY_SEPARATOR.'downloads')
            ?: __DIR__.DIRECTORY_SEPARATOR.'Browser'.DIRECTORY_SEPARATOR.'downloads';

        return $path ? $base.DIRECTORY_SEPARATOR.$path : $base;
    }
    /**
     * Prepare for Dusk test execution.
     */
    #[BeforeClass]
    public static function prepare(): void
    {
        if (! is_dir(static::downloadsPath())) {
            mkdir(static::downloadsPath(), 0777, true);
        }

        if (! static::runningInSail()) {
            static::startChromeDriver(['--port=9515']);
        }
    }

    /**
     * Create the RemoteWebDriver instance.
     */
    protected function driver(): RemoteWebDriver
    {
        $options = (new ChromeOptions)->addArguments(collect([
            $this->shouldStartMaximized() ? '--start-maximized' : '--window-size=1920,1080',
            '--disable-search-engine-choice-screen',
            '--disable-smooth-scrolling',
        ])->unless($this->hasHeadlessDisabled(), function (Collection $items) {
            return $items->merge([
                '--disable-gpu',
                '--headless=new',
            ]);
        })->all());

        // Autorise le téléchargement automatique (sans popup de confirmation)
        // vers un dossier fixe, pour que les tests qui téléchargent un
        // fichier (ex: le bouton "Canevas") puissent ensuite le relire.
        $options->setExperimentalOption('prefs', [
            'download.default_directory' => static::downloadsPath(),
            'download.prompt_for_download' => false,
            'download.directory_upgrade' => true,
            'safebrowsing.enabled' => true,
        ]);

        return RemoteWebDriver::create(
            $_ENV['DUSK_DRIVER_URL'] ?? env('DUSK_DRIVER_URL') ?? 'http://localhost:9515',
            DesiredCapabilities::chrome()->setCapability(
                ChromeOptions::CAPABILITY, $options
            )
        );
    }
}
