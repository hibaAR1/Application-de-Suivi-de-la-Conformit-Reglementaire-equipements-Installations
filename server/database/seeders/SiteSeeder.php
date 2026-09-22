<?php

namespace Database\Seeders;

use App\Models\Filiale;
use App\Models\Site;
use Illuminate\Database\Seeder;

class SiteSeeder extends Seeder
{
    public function run(): void
    {
        $filiales = Filiale::all()->keyBy('code');

        // Ménara Prefa : plusieurs sites réels
        $sitesMP = [
            '201' => 'Ménara Prefa — Marrakech',
            '202' => 'Ménara Prefa — Kelâa des Sraghna',
            '203' => 'Ménara Prefa — Beni Mellal',
            '204' => 'Ménara Prefa — Khouribga',
            '205' => 'Ménara Prefa — Safi',
        ];

        if ($filiales->has('MP')) {
            foreach ($sitesMP as $code => $libelle) {
                Site::firstOrCreate(
                    ['code' => $code, 'id_filiale' => $filiales['MP']->id_filiale],
                    ['libelle' => $libelle],
                );
            }
        }

        // Les autres filiales : un site par défaut, à compléter plus tard dans l'appli.
        $autresDefauts = [
            'CTM' => ['code' => 'CTM-01', 'libelle' => 'Carrières & Transport Ménara — Siège'],
            'MT' => ['code' => 'MT-01', 'libelle' => 'Ménara Transport — Siège'],
            'ML' => ['code' => 'ML-01', 'libelle' => 'Ménara Logistique — Siège'],
            'TCGM' => ['code' => 'TCGM-01', 'libelle' => 'TCGM — Siège'],
        ];

        foreach ($autresDefauts as $codeFiliale => $site) {
            if (!$filiales->has($codeFiliale)) {
                continue;
            }
            Site::firstOrCreate(
                ['code' => $site['code'], 'id_filiale' => $filiales[$codeFiliale]->id_filiale],
                ['libelle' => $site['libelle']],
            );
        }

        echo "✅ Sites créés ou déjà existants (5 pour MP, 1 par défaut pour les autres)\n";
    }
}
