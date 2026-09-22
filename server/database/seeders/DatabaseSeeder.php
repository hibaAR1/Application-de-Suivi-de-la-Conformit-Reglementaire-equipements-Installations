<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Point d'entrée unique : organise et appelle tous les seeders,
     * dans le bon ordre (les rôles et filiales doivent exister avant
     * les permissions et les utilisateurs qui en dépendent ; les sites
     * doivent exister après les filiales).
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            FilialeSeeder::class,
            PermissionSeeder::class,
            UtilisateurSeeder::class,
            TypeEquipementSeeder::class,
            SiteSeeder::class,
        ]);
    }
}
