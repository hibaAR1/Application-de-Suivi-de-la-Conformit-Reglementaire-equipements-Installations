<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Sépare le bouton "Ouvrir" (fiche détaillée d'un équipement ou d'un engin) de
// la permission "Voir" (qui donne seulement la liste) :
//   equipements.ouvrir, engins.ouvrir
// Pour qu'aucun compte ne perde d'accès, chaque rôle qui avait
// equipements.view reçoit equipements.ouvrir, et chaque rôle qui avait
// engins.view reçoit engins.ouvrir. Les libellés des permissions "Voir" sont
// aussi précisés.
return new class extends Migration
{
    // code => [libellé, permission dont héritent les rôles]
    private const NOUVELLES = [
        'equipements.ouvrir' => ['Ouvrir la fiche d\'un équipement (bouton Ouvrir)', 'equipements.view'],
        'engins.ouvrir' => ['Ouvrir la fiche d\'un engin (bouton Ouvrir)', 'engins.view'],
    ];

    private const LIBELLES = [
        'equipements.view' => ['Voir les équipements (liste)', 'Voir les équipements'],
        'engins.view' => ['Voir les engins (liste)', 'Voir les engins'],
    ];

    public function up(): void
    {
        foreach (self::NOUVELLES as $code => [$libelle, $heritede]) {
            $id = DB::table('permission')->where('code', $code)->value('id_permission')
                ?? DB::table('permission')->insertGetId(
                    ['code' => $code, 'libelle' => $libelle],
                    'id_permission'
                );
            DB::table('permission')->where('code', $code)->update(['libelle' => $libelle]);

            $idSource = DB::table('permission')->where('code', $heritede)->value('id_permission');
            if (!$idSource) {
                continue;
            }

            $roles = DB::table('role_permission')->where('id_permission', $idSource)->pluck('id_role');
            foreach ($roles as $idRole) {
                $dejaLa = DB::table('role_permission')
                    ->where('id_role', $idRole)
                    ->where('id_permission', $id)
                    ->exists();
                if (!$dejaLa) {
                    DB::table('role_permission')->insert([
                        'id_role' => $idRole,
                        'id_permission' => $id,
                    ]);
                }
            }
        }

        foreach (self::LIBELLES as $code => [$nouveau]) {
            DB::table('permission')->where('code', $code)->update(['libelle' => $nouveau]);
        }
    }

    public function down(): void
    {
        // Les liens avec les rôles disparaissent avec les permissions (cascade).
        DB::table('permission')->whereIn('code', array_keys(self::NOUVELLES))->delete();

        foreach (self::LIBELLES as $code => [, $ancien]) {
            DB::table('permission')->where('code', $code)->update(['libelle' => $ancien]);
        }
    }
};
