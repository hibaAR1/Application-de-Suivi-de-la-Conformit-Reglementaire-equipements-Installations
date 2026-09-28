<?php

namespace Tests\Browser;

use App\Modules\Equipement\Equipement;
use App\Modules\Filiale\Filiale;
use App\Modules\Site\Site;
use App\Modules\TypeEquipement\TypeEquipement;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

// Le scan QR code lui-même (la caméra) ne peut pas être testé
// automatiquement : ça nécessite une vraie caméra et un vrai QR code
// physique en face. Ce qu'on peut et doit tester automatiquement :
// - la permission "equipements.scanner" (qui a le droit d'accéder au scan —
//   voir Sidebar.jsx / ScanSimule.jsx / MobileControl.jsx et
//   PermissionSeeder.php pour qui a quoi),
// - la saisie manuelle de l'identifiant, prévue en repli si la caméra n'est
//   pas disponible ou mal cadrée (voir ScannerEquipementModal.jsx).
//
// Le formulaire affiché après un scan réussi (MobileControl.jsx, route
// /scan/:id — enregistrement d'un contrôle) fait partie du module
// Contrôles & Réserves et sera testé séparément.
class ScanTest extends DuskTestCase
{
    private function connecter(Browser $browser, string $email, string $motDePasse): void
    {
        $browser->visit('/login')
            ->type('.login-label:nth-child(1) input', $email)
            ->type('.login-label:nth-child(2) input', $motDePasse)
            ->press('Se connecter')
            ->waitUntilMissing('.login-page', 20);
    }

    /**
     * @return array<string, array{0: string, 1: string}>  [email, mot de passe]
     */
    public static function comptesAutorises(): array
    {
        return [
            'Super Admin' => ['admin@menara-holding.ma', 'MenaraAdmin2026!'],
            'Administrateur SMI Holding' => ['smi@menara-holding.ma', 'MenaraSMI2026!'],
            'Technicien terrain' => ['technicien.ctm@menara-holding.ma', 'MenaraTech2026!'],
        ];
    }

    // Le bouton "Scanner QR Code" (sidebar) et l'accès à /scan doivent
    // suivre exactement la permission equipements.scanner (voir
    // PermissionSeeder.php).
    public function test_acces_autorise_au_scan(): void
    {
        foreach (self::comptesAutorises() as [$email, $motDePasse]) {
            $this->browse(function (Browser $browser) use ($email, $motDePasse) {
                $this->connecter($browser, $email, $motDePasse);

                $browser->assertVisible('button[title="Scanner un équipement"]')
                    ->visit('/scan')
                    ->waitFor('h2', 10)
                    ->assertDontSee('Accès refusé');
            });
        }
    }

    // Cas particulier du Référent HSE filiale : il a pourtant beaucoup
    // d'autres droits (equipements.edit, controles.create, ...) mais PAS
    // celui de scanner (demande client, voir PermissionSeeder.php). Test
    // séparé (et pas dans une boucle avec les autres) pour que le résultat
    // soit sans ambiguïté sur qui, précisément, échoue.
    public function test_acces_refuse_au_scan_pour_referent_hse_filiale(): void
    {
        $this->browse(function (Browser $browser) {
            $this->connecter($browser, 'hse.ctm@menara-holding.ma', 'MenaraHSE2026!');

            $browser->assertMissing('button[title="Scanner un équipement"]')
                ->visit('/scan')
                ->waitFor('h2', 15)
                ->waitForText('Accès refusé', 15)
                ->assertSee('Accès refusé');
        });
    }

    public function test_acces_refuse_au_scan_pour_consultation_direction(): void
    {
        $this->browse(function (Browser $browser) {
            $this->connecter($browser, 'direction@menara-holding.ma', 'MenaraDirection2026!');

            $browser->assertMissing('button[title="Scanner un équipement"]')
                ->visit('/scan')
                ->waitFor('h2', 15)
                ->waitForText('Accès refusé', 15)
                ->assertSee('Accès refusé');
        });
    }

    // La caméra ne peut pas être simulée dans ce test : on vérifie donc la
    // saisie manuelle, qui est le vrai repli utilisé sur le terrain quand la
    // caméra est indisponible ou mal cadrée.
    public function test_saisie_manuelle_de_lidentifiant_dans_la_popup_scanner(): void
    {
        $filiale = Filiale::where('code', 'CTM')->firstOrFail();
        $site = Site::where('id_filiale', $filiale->id_filiale)->where('code', '201')->firstOrFail();
        $type = TypeEquipement::where('libelle', 'Transformateur')->firstOrFail();

        $equipement = Equipement::create([
            'id_equipement' => 'SCAN-TEST-001',
            'referentiel' => 'SCAN-TEST-001',
            'statut' => 'Conforme',
            'id_filiale' => $filiale->id_filiale,
            'id_site' => $site->id_site,
            'id_type_equipement' => $type->id_type_equipement,
            'designation' => 'Équipement Test Scan',
            'numero_serie' => 'SN-SCAN-'.uniqid(),
            'date_mise_en_service' => '2026-01-01',
        ]);

        try {
            $this->browse(function (Browser $browser) use ($equipement) {
                $this->connecter($browser, 'technicien.ctm@menara-holding.ma', 'MenaraTech2026!');

                $browser->press('Scanner QR Code')
                    ->waitFor('input[placeholder^="ex:"]', 10)
                    // D'abord un identifiant qui n'existe pas : message
                    // d'erreur clair, pas une page blanche ni une erreur
                    // technique.
                    ->type('input[placeholder^="ex:"]', 'CTM-000-XXXX-99')
                    ->press('Accéder')
                    ->waitForText('Aucun équipement trouvé avec cet identifiant.', 10)
                    ->assertSee('Aucun équipement trouvé avec cet identifiant.')
                    // Puis le bon identifiant : la Fiche Technique s'affiche.
                    ->clear('input[placeholder^="ex:"]')
                    ->type('input[placeholder^="ex:"]', $equipement->id_equipement)
                    ->press('Accéder')
                    ->waitForText('Fiche Technique — '.$equipement->id_equipement, 10)
                    ->assertSee('Fiche Technique — '.$equipement->id_equipement);
            });
        } finally {
            $equipement->delete();
        }
    }
}
