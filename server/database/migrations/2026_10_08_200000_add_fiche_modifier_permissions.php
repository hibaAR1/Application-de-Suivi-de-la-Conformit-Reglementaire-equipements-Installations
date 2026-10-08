<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Sépare la modification faite depuis les onglets Informations et
// Caractéristiques de la fiche (equipements.fiche_modifier,
// engins.fiche_modifier) du bouton ✎ de la liste (equipements.edit,
// engins.edit). Pour qu'aucun compte ne perde d'accès, chaque rôle qui avait
// equipements.edit / engins.edit reçoit la nouvelle permission du même type.
return new class extends Migration
{
    // code => [libellé, permission dont héritent les rôles]
    private const NOUVELLES = [
        'equipements.fiche_modifier' => ['Fiche · Informations et Caractéristiques : modifier les champs', 'equipements.edit'],
        'engins.fiche_modifier' => ['Fiche · Informations et Caractéristiques : modifier les champs', 'engins.edit'],
    ];

    // code => [nouveau libellé, ancien libellé]
    private const LIBELLES = [
        'equipements.edit' => [
            'Modifier un équipement (bouton ✎ de la liste)',
            'Modifier un équipement (bouton ✎, onglets Informations et Caractéristiques)',
        ],
        'engins.edit' => [
            'Modifier un engin (bouton ✎ de la liste)',
            'Modifier un engin (bouton ✎, onglets Informations et Caractéristiques)',
        ],
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
