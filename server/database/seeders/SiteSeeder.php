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

        // Supprime les anciens sites generiques "Siege" (code se terminant par
        // "-01", ex. CTM-01, MT-01...) : on ne garde que les 5 vraies villes.
        $supprimes = Site::where('code', 'like', '%-01')->delete();

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

        echo "✅ {$supprimes} ancien(s) site(s) 'Siège' supprimé(s), " . count($sites) . " sites créés ou déjà existants pour chacune des " . $filiales->count() . " filiale(s)\n";
    }
}
