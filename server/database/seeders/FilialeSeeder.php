<?php

namespace Database\Seeders;

use App\Models\Filiale;
use Illuminate\Database\Seeder;

class FilialeSeeder extends Seeder
{
    public function run(): void
    {
        $filiales = [
            'CTM'  => 'Carrières & Transport Ménara',
            'MP'   => 'Ménara Prefa',
            'MT'   => 'Ménara Transport',
            'ML'   => 'Ménara Logistique',
            'TCGM' => 'TCGM',
        ];

        foreach ($filiales as $code => $libelle) {
            Filiale::firstOrCreate(['code' => $code], ['libelle' => $libelle]);
        }

        echo "✅ " . count($filiales) . " filiale(s) créée(s) ou déjà existante(s)\n";
    }
}
