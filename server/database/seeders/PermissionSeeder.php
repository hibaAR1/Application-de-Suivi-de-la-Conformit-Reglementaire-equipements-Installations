<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer toutes les permissions. Cette liste est la seule source : les
        //    permissions ne se créent pas depuis l'interface, car chacune doit
        //    être vérifiée dans le code (routes et écrans).
        $permissions = [
            // --- Équipements ---
            'equipements.view' => 'Voir les équipements (liste)',
            'equipements.ouvrir' => 'Ouvrir la fiche d\'un équipement (bouton Ouvrir, voir les onglets)',
            'equipements.fiche_technique' => 'Fiche technique d\'un équipement (icône QR de la liste, à imprimer)',
            'equipements.create' => 'Créer un équipement (bouton « Nouvel équipement »)',
            'equipements.importer' => 'Importer des équipements par fichier Excel (boutons Canevas et Importer)',
            'equipements.edit' => 'Modifier un équipement (bouton ✎ de la liste)',
            'equipements.fiche_modifier' => 'Fiche · Informations et Caractéristiques : modifier les champs',
            'equipements.delete' => 'Supprimer un équipement',
            'equipements.rapports' => 'Fiche · Rapports : ajouter un rapport',
            'controles.create' => 'Fiche · Réserves : ajouter une réserve (et dernier contrôle du formulaire)',
            'reserves.lever' => 'Fiche · Réserves : lever une réserve',
            'equipements.assistant' => 'Fiche · Assistant IA : utiliser l\'assistant',

            // --- Scanner et étiquettes QR (pages du menu) ---
            'equipements.scanner' => 'Scanner les équipements (bouton « Scanner QR Code » du menu)',
            'equipements.etiquettes' => 'Étiquettes QR des équipements (bouton « Étiquettes QR » du menu)',

            // --- Engins (permissions séparées de celles des équipements) ---
            'engins.view' => 'Voir les engins (liste)',
            'engins.ouvrir' => 'Ouvrir la fiche d\'un engin (bouton Ouvrir, voir les onglets)',
            'engins.fiche_technique' => 'Fiche technique d\'un engin (icône QR de la liste, à imprimer)',
            'engins.create' => 'Créer un engin (bouton « Nouvel engin »)',
            'engins.importer' => 'Importer des engins par fichier Excel (boutons Canevas et Importer)',
            'engins.edit' => 'Modifier un engin (bouton ✎ de la liste)',
            'engins.fiche_modifier' => 'Fiche · Informations et Caractéristiques : modifier les champs',
            'engins.delete' => 'Supprimer un engin',
            'engins.rapports' => 'Fiche · Rapports : ajouter un rapport',
            'engins.controler' => 'Fiche · Réserves : ajouter une réserve (et dernier contrôle du formulaire)',
            'engins.lever_reserve' => 'Fiche · Réserves : lever une réserve',
            'engins.assistant' => 'Fiche · Assistant IA : utiliser l\'assistant',
            'engins.scanner' => 'Scanner les engins (bouton « Scanner QR Code » du menu)',
            'engins.etiquettes' => 'Étiquettes QR des engins (bouton « Étiquettes QR » du menu)',

            // --- Tableau de bord ---
            'dashboard.filiale.view' => 'Voir le tableau de bord de sa filiale',
            'dashboard.groupe.view' => 'Voir le tableau de bord de toutes les filiales',

            // --- Administration ---
            'utilisateurs.view' => 'Voir les utilisateurs',
            'utilisateurs.create' => 'Créer un utilisateur',
            'utilisateurs.edit' => 'Modifier un utilisateur',
            'utilisateurs.delete' => 'Supprimer un utilisateur',
            'roles.view' => 'Voir les rôles et les permissions',
            'roles.create' => 'Créer un rôle',
            'roles.edit' => 'Modifier un rôle',
            'roles.delete' => 'Supprimer un rôle',
            'donnees_base.view' => 'Voir les données de base (types, groupes)',
            'donnees_base.create' => 'Créer une donnée de base',
            'donnees_base.edit' => 'Modifier une donnée de base',
            'donnees_base.delete' => 'Supprimer une donnée de base',
        ];

        foreach ($permissions as $code => $libelle) {
            Permission::updateOrCreate(
                ['code' => $code],
                ['libelle' => $libelle]
            );
        }

        // 2. Associer les permissions à chaque rôle
        $mapping = [
            'Super Admin' => Permission::all()->pluck('code')->toArray(), // accès total

            'Administrateur SMI Holding' => Permission::all()->pluck('code')->toArray(), // accès total

            // Référent HSE filiale : pas le droit de scanner (ni équipements ni engins) —
            // volontairement absent de sa liste ci-dessous.
            'Référent HSE filiale' => [
                'equipements.view', 'equipements.ouvrir', 'equipements.create', 'equipements.importer', 'equipements.edit', 'equipements.fiche_modifier',
                'equipements.rapports', 'controles.create', 'reserves.lever', 'equipements.assistant',
                'dashboard.filiale.view',
                'donnees_base.view', 'donnees_base.create', 'donnees_base.edit', 'donnees_base.delete',
                'engins.view', 'engins.ouvrir', 'engins.create', 'engins.importer', 'engins.edit', 'engins.fiche_modifier',
                'engins.rapports', 'engins.controler', 'engins.lever_reserve', 'engins.assistant',
            ],

            'Technicien terrain' => [
                'equipements.view', 'equipements.ouvrir', 'equipements.fiche_technique', 'controles.create', 'equipements.assistant',
                'equipements.scanner', 'equipements.etiquettes',
                'engins.view', 'engins.ouvrir', 'engins.fiche_technique', 'engins.controler', 'engins.assistant',
                'engins.scanner', 'engins.etiquettes',
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
