<?php

namespace Database\Seeders;

use App\Modules\Filiale\Filiale;
use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    public function run(): void
    {
        // Filiale de référence pour les comptes rattachés à une seule filiale
        // (Référent HSE, Technicien terrain) — modifiable si besoin.
        $filialeCTM = Filiale::where('code', 'CTM')->first();

        $comptes = [
            [
                'email' => 'admin@menara-holding.ma',
                'nom' => 'Administrateur',
                'mot_de_passe' => 'MenaraAdmin2026!',
                'role' => 'Super Admin',
                'filiale' => null, // voit toutes les filiales
            ],
            [
                'email' => 'smi@menara-holding.ma',
                'nom' => 'Responsable SMI',
                'mot_de_passe' => 'MenaraSMI2026!',
                'role' => 'Administrateur SMI Holding',
                'filiale' => null, // voit toutes les filiales
            ],
            [
                'email' => 'hse.ctm@menara-holding.ma',
                'nom' => 'Référent HSE',
                'mot_de_passe' => 'MenaraHSE2026!',
                'role' => 'Référent HSE filiale',
                'filiale' => $filialeCTM,
            ],
            [
                'email' => 'technicien.ctm@menara-holding.ma',
                'nom' => 'Technicien Terrain',
                'mot_de_passe' => 'MenaraTech2026!',
                'role' => 'Technicien terrain',
                'filiale' => $filialeCTM,
            ],
            [
                'email' => 'direction@menara-holding.ma',
                'nom' => 'Direction Générale',
                'mot_de_passe' => 'MenaraDirection2026!',
                'role' => 'Consultation Direction',
                'filiale' => null, // voit toutes les filiales
            ],
        ];

        foreach ($comptes as $compte) {
            $role = Role::where('libelle', $compte['role'])->first();

            if (!$role) {
                echo "⚠️ Rôle '{$compte['role']}' introuvable — lance d'abord RoleSeeder\n";
                continue;
            }

            $utilisateur = Utilisateur::firstOrCreate(
                ['email' => $compte['email']],
                [
                    'nom' => $compte['nom'],
                    'mot_de_passe' => Hash::make($compte['mot_de_passe']),
                    'id_role' => $role->id_role,
                    'id_filiale' => $compte['filiale']?->id_filiale,
                    'actif' => 1,
                ]
            );

            if ($compte['filiale']) {
                $utilisateur->filiales()->syncWithoutDetaching([$compte['filiale']->id_filiale]);
            }

            echo "✅ {$compte['role']} → {$compte['email']}\n";
        }
    }
}
