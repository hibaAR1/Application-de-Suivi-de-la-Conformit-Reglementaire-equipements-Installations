<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Remplace la permission unique "utilisateurs.manage" (qui autorisait tout sur
// les utilisateurs) par 4 permissions séparées : voir, créer, modifier,
// supprimer. "utilisateurs.manage" est conservée, mais ne sert plus qu'à
// administrer les rôles, les permissions et les données de base.
//
// Pour qu'aucun compte ne perde d'accès, chaque rôle qui avait
// "utilisateurs.manage" reçoit automatiquement les 4 nouvelles permissions.
return new class extends Migration
{
    private const NOUVELLES = [
        'utilisateurs.view'   => 'Voir les utilisateurs',
        'utilisateurs.create' => 'Créer un utilisateur',
        'utilisateurs.edit'   => 'Modifier un utilisateur',
        'utilisateurs.delete' => 'Supprimer un utilisateur',
    ];

    public function up(): void
    {
        // 1. Créer les 4 permissions (sans doublon si elles existent déjà).
        $ids = [];
        foreach (self::NOUVELLES as $code => $libelle) {
            $existante = DB::table('permission')->where('code', $code)->value('id_permission');
            $ids[] = $existante ?? DB::table('permission')->insertGetId(
                ['code' => $code, 'libelle' => $libelle],
                'id_permission'
            );
        }

        // 2. Donner ces permissions aux rôles qui avaient "utilisateurs.manage".
        //    Si "utilisateurs.manage" a déjà été supprimée (migration
        //    replace_manage_permission passée avant), on se base sur les rôles
        //    qui ont "roles.view" : ce sont exactement les anciens gestionnaires.
        $idManage = DB::table('permission')->where('code', 'utilisateurs.manage')->value('id_permission');
        $idReference = $idManage ?? DB::table('permission')->where('code', 'roles.view')->value('id_permission');
        if (!$idReference) {
            return;
        }

        $roles = DB::table('role_permission')->where('id_permission', $idReference)->pluck('id_role');
        foreach ($roles as $idRole) {
            foreach ($ids as $idPermission) {
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

        // 3. "utilisateurs.manage" (si elle existe encore) change de rôle.
        if ($idManage) {
            DB::table('permission')->where('id_permission', $idManage)->update([
                'libelle' => 'Administrer les rôles, les permissions et les données de base',
            ]);
        }
    }

    public function down(): void
    {
        // Les liens avec les rôles disparaissent avec les permissions (cascade).
        DB::table('permission')->whereIn('code', array_keys(self::NOUVELLES))->delete();

        DB::table('permission')->where('code', 'utilisateurs.manage')->update([
            'libelle' => 'Gérer les utilisateurs',
        ]);
    }
};
