<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Supprime la permission globale "utilisateurs.manage" et la remplace par des
// permissions détaillées (voir, créer, modifier, supprimer) pour les deux
// parties qu'elle protégeait encore : les rôles et les données de base
// (types d'équipement, groupes).
//
// Aucun compte ne perd d'accès :
//  - les rôles qui avaient "utilisateurs.manage" reçoivent toutes les
//    nouvelles permissions (rôles + données de base) ;
//  - les rôles qui avaient "equipements.create" reçoivent celles des données
//    de base, car ils pouvaient déjà créer, modifier et supprimer types et
//    groupes.
return new class extends Migration
{
    private const ROLES = [
        'roles.view'   => 'Voir les rôles et les permissions',
        'roles.create' => 'Créer un rôle ou une permission',
        'roles.edit'   => 'Modifier un rôle',
        'roles.delete' => 'Supprimer un rôle',
    ];

    private const DONNEES_BASE = [
        'donnees_base.view'   => 'Voir les données de base (types, groupes)',
        'donnees_base.create' => 'Créer une donnée de base',
        'donnees_base.edit'   => 'Modifier une donnée de base',
        'donnees_base.delete' => 'Supprimer une donnée de base',
    ];

    public function up(): void
    {
        $idsRoles = $this->creer(self::ROLES);
        $idsDonneesBase = $this->creer(self::DONNEES_BASE);

        $idManage = $this->idPermission('utilisateurs.manage');
        $idCreerEquipement = $this->idPermission('equipements.create');

        if ($idManage) {
            foreach ($this->rolesAyant($idManage) as $idRole) {
                $this->donner($idRole, array_merge($idsRoles, $idsDonneesBase));
            }
        }
        if ($idCreerEquipement) {
            foreach ($this->rolesAyant($idCreerEquipement) as $idRole) {
                $this->donner($idRole, $idsDonneesBase);
            }
        }

        // Les liens avec les rôles disparaissent avec la permission (cascade).
        if ($idManage) {
            DB::table('permission')->where('id_permission', $idManage)->delete();
        }
    }

    public function down(): void
    {
        $idManage = $this->idPermission('utilisateurs.manage')
            ?? DB::table('permission')->insertGetId(
                ['code' => 'utilisateurs.manage', 'libelle' => 'Gérer les utilisateurs'],
                'id_permission'
            );

        // Les rôles qui avaient les droits sur les rôles retrouvent "manage".
        $idView = $this->idPermission('roles.view');
        if ($idView) {
            foreach ($this->rolesAyant($idView) as $idRole) {
                $this->donner($idRole, [$idManage]);
            }
        }

        DB::table('permission')
            ->whereIn('code', array_merge(array_keys(self::ROLES), array_keys(self::DONNEES_BASE)))
            ->delete();
    }

    // Crée les permissions absentes et renvoie leurs identifiants.
    private function creer(array $permissions): array
    {
        $ids = [];
        foreach ($permissions as $code => $libelle) {
            $ids[] = $this->idPermission($code) ?? DB::table('permission')->insertGetId(
                ['code' => $code, 'libelle' => $libelle],
                'id_permission'
            );
        }
        return $ids;
    }

    private function idPermission(string $code)
    {
        return DB::table('permission')->where('code', $code)->value('id_permission');
    }

    private function rolesAyant(int $idPermission)
    {
        return DB::table('role_permission')->where('id_permission', $idPermission)->pluck('id_role');
    }

    // Donne les permissions à un rôle, sans créer de doublon.
    private function donner($idRole, array $idsPermissions): void
    {
        foreach ($idsPermissions as $idPermission) {
            $dejaLa = DB::table('role_permission')
                ->where('id_role', $idRole)
                ->where('id_permission', $idPermission)
                ->exists();
            if (!$dejaLa) {
                DB::table('role_permission')->insert([
                    'id_role' => $idRole,
                    'id_permission' => $idPermission,
                ]);
            }
        }
    }
};
