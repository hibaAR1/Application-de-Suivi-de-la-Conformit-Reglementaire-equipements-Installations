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

        // Les 5 sites (villes) du groupe, disponibles pour toutes les filiales.
        $sites = [
            '201' => 'Marrakech',
            '202' => 'Kelâa des Sraghna',
            '203' => 'Beni Mellal',
            '204' => 'Khouribga',
            '205' => 'Safi',
        ];

        foreach ($filiales as $codeFiliale => $filiale) {
            foreach ($sites as $code => $ville) {
                Site::firstOrCreate(
                    ['code' => $code, 'id_filiale' => $filiale->id_filiale],
                    ['libelle' => "{$filiale->libelle} — {$ville}"],
                );
            }
        }

        echo "✅ " . count($sites) . " sites créés ou déjà existants pour chacune des " . $filiales->count() . " filiale(s)\n";
    }
}
