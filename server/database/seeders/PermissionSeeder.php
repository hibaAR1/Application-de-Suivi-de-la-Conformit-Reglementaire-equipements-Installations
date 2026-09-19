<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer toutes les permissions
        $permissions = [
            'equipements.view'       => 'Voir les équipements',
            'equipements.create'     => 'Créer un équipement',
            'equipements.edit'       => 'Modifier un équipement',
            'controles.create'       => 'Enregistrer un contrôle',
            'reserves.lever'         => 'Lever une réserve',
            'dashboard.filiale.view' => 'Voir le tableau de bord de sa filiale',
            'dashboard.groupe.view'  => 'Voir le tableau de bord consolidé Groupe',
            'utilisateurs.manage'    => 'Gérer les utilisateurs',
        ];

        foreach ($permissions as $code => $libelle) {
            Permission::firstOrCreate(['code' => $code], ['libelle' => $libelle]);
        }

        // 2. Associer les permissions à chaque rôle (selon la section 3.5 du CDC)
        $mapping = [
            'Super Admin' => Permission::all()->pluck('code')->toArray(), // accès total

            'Administrateur SMI Holding' => Permission::all()->pluck('code')->toArray(), // accès total

            'Référent HSE filiale' => [
                'equipements.view', 'equipements.create', 'equipements.edit',
                'controles.create', 'reserves.lever', 'dashboard.filiale.view',
            ],

            'Technicien terrain' => [
                'equipements.view', 'controles.create',
            ],

            'Consultation Direction' => [
                'dashboard.filiale.view', 'dashboard.groupe.view',
            ],
        ];

        foreach ($mapping as $libelleRole => $codesPermissions) {
            $role = Role::where('libelle', $libelleRole)->first();

            if (!$role) {
                echo "⚠️ Rôle introuvable : {$libelleRole}\n";
                continue;
            }

            $idsPermissions = Permission::whereIn('code', $codesPermissions)->pluck('id_permission');
            $role->permissions()->sync($idsPermissions);

            echo "✅ {$libelleRole} → " . count($codesPermissions) . " permission(s) attachée(s)\n";
        }
    }
}
