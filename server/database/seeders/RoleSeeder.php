<?php

namespace Database\Seeders;

use App\Modules\Role\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Super Admin',
            'Administrateur SMI Holding',
            'Référent HSE filiale',
            'Technicien terrain',
            'Consultation Direction',
        ];

        foreach ($roles as $libelle) {
            Role::firstOrCreate(['libelle' => $libelle]);
        }

        echo "✅ " . count($roles) . " rôle(s) créé(s) ou déjà existant(s)\n";
    }
}
