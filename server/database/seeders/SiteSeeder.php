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
        // (tableau de paires, pas un tableau associatif : sinon PHP transforme
        // automatiquement les clés numeriques "201".."205" en entiers, ce qui fait
        // planter la comparaison SQL Server avec les codes texte deja en base
        // comme "CTM-01".)
        $sites = [
            ['201', 'Marrakech'],
            ['202', 'Kelâa des Sraghna'],
            ['203', 'Beni Mellal'],
            ['204', 'Khouribga'],
            ['205', 'Safi'],
        ];

        foreach ($filiales as $codeFiliale => $filiale) {
            foreach ($sites as [$code, $ville]) {
                Site::firstOrCreate(
                    ['code' => (string) $code, 'id_filiale' => $filiale->id_filiale],
                    ['libelle' => "{$filiale->libelle} — {$ville}"],
                );
            }
        }

        echo "✅ " . count($sites) . " sites créés ou déjà existants pour chacune des " . $filiales->count() . " filiale(s)\n";
    }
}
