<?php

namespace Tests\Browser;

use App\Modules\Equipement\Equipement;
use App\Modules\Filiale\Filiale;
use App\Modules\Site\Site;
use App\Modules\TypeEquipement\TypeEquipement;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use ZipArchive;

// Le bouton "Importer" (page Équipements) lit un fichier .xlsx au même
// format que celui téléchargé par "Canevas" (voir CanevasTest.php et
// excelEquipements.js) et crée un équipement par ligne, via les mêmes
// règles que le formulaire de création (voir EquipementsListe.jsx,
// gererImportFichier()).
//
// Pas besoin de télécharger un vrai fichier ici : on construit un .xlsx
// minimal directement en PHP (un .xlsx est un .zip de fichiers XML), sans
// dépendance supplémentaire (pas de phpoffice/phpspreadsheet installé).
class ImportTest extends DuskTestCase
{
    private const COLONNES = [
        'Filiale', 'Site', 'Type', 'Designation', 'Marque_Modele',
        'Numero_Serie', 'Date_Mise_En_Service', 'Periodicite_Mois', 'Statut',
        'Fabricant', 'Modele', 'Annee_Fabrication', 'Organisme_Controle',
        'Date_Dernier_Controle',
    ];

    /** Construit un .xlsx minimal (cellules texte brut) à partir de lignes de valeurs. */
    private function creerXlsxDeTest(array $lignes): string
    {
        $chemin = tempnam(sys_get_temp_dir(), 'import_test_').'.xlsx';

        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'</Types>';

        $relsRoot = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';

        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Équipements" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';

        $workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'</Relationships>';

        $lettre = fn (int $i) => chr(65 + $i);
        $xmlLignes = '';
        foreach (array_values($lignes) as $numLigne => $valeurs) {
            $cellules = '';
            foreach (array_values($valeurs) as $i => $valeur) {
                $echappee = htmlspecialchars((string) $valeur, ENT_XML1 | ENT_QUOTES, 'UTF-8');
                $cellules .= '<c r="'.$lettre($i).($numLigne + 1).'" t="inlineStr"><is><t>'.$echappee.'</t></is></c>';
            }
            $xmlLignes .= '<row r="'.($numLigne + 1).'">'.$cellules.'</row>';
        }

        $sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<sheetData>'.$xmlLignes.'</sheetData>'
            .'</worksheet>';

        $zip = new ZipArchive();
        $zip->open($chemin, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $contentTypes);
        $zip->addFromString('_rels/.rels', $relsRoot);
        $zip->addFromString('xl/workbook.xml', $workbook);
        $zip->addFromString('xl/_rels/workbook.xml.rels', $workbookRels);
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet);
        $zip->close();

        return $chemin;
    }

    public function test_import_dun_fichier_xlsx_cree_les_equipements_valides_et_liste_les_erreurs(): void
    {
        $filiale = Filiale::where('code', 'CTM')->firstOrFail();
        $site = Site::where('id_filiale', $filiale->id_filiale)->where('code', '201')->firstOrFail();
        $type = TypeEquipement::where('libelle', 'Transformateur')->firstOrFail();
        $numeroSerie = 'SN-IMPORT-'.uniqid();

        $cheminXlsx = $this->creerXlsxDeTest([
            self::COLONNES,
            // Ligne valide : doit créer un équipement.
            [
                $filiale->code, $site->libelle, $type->libelle,
                'Équipement Test Import', 'Marque Test', $numeroSerie,
                '2026-01-15', '12', 'Conforme', 'Fabricant Test', 'Modele Test',
                '2024', '', '',
            ],
            // Ligne invalide (filiale inconnue) : doit remonter en erreur,
            // sans bloquer la ligne valide au-dessus.
            [
                'ZZZ-INCONNU', '', $type->libelle,
                'Équipement Filiale Invalide', '', 'SN-IMPORT-INVALIDE-'.uniqid(),
                '2026-01-15', '12', 'Conforme', '', '', '', '', '',
            ],
        ]);

                try {
            $this->browse(function (Browser $browser) use ($cheminXlsx) {
                $browser->visit('/login')
                    ->type('.login-label:nth-child(1) input', 'admin@menara-holding.ma')
                    ->type('.login-label:nth-child(2) input', 'MenaraAdmin2026!')
                    ->press('Se connecter')
                    ->waitUntilMissing('.login-page', 20)
                    ->visit('/equipements')
                    ->waitFor('.topbar', 10)
                    ->waitUntilMissingText('Chargement...', 10)
                    // L'input est caché (voir EquipementsListe.jsx : le clic sur
                    // "Importer" ne fait que déclencher un clic dessus) — on le
                    // remplit directement, ça déclenche le même onChange.
                    ->attach('input[type="file"]', $cheminXlsx)
                    ->waitForText('Import terminé', 15)
                    ->assertSee('Import terminé : 1 / 2 équipement(s) créé(s).')
                    ->assertSee('filiale "ZZZ-INCONNU" inconnue');
            });

            $this->assertTrue(
                Equipement::where('numero_serie', $numeroSerie)->exists(),
                "L'équipement importé n'a pas été trouvé en base."
            );
        } finally {
            unlink($cheminXlsx);
            Equipement::where('numero_serie', $numeroSerie)->delete();
        }
    }
}
