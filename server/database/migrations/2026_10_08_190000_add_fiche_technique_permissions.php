<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Sépare la "Fiche technique" (icône QR de chaque ligne des listes, fiche à
// imprimer) de la page "Étiquettes QR" du menu :
//   equipements.fiche_technique, engins.fiche_technique
// Pour qu'aucun compte ne perde d'accès, chaque rôle qui avait
// equipements.etiquettes / engins.etiquettes reçoit la nouvelle permission
// du même type. Le libellé des permissions "Étiquettes QR" est précisé.
return new class extends Migration
{
    // code => [libellé, permission dont héritent les rôles]
    private const NOUVELLES = [
        'equipements.fiche_technique' => ['Fiche technique d\'un équipement (icône QR de la liste, à imprimer)', 'equipements.etiquettes'],
        'engins.fiche_technique' => ['Fiche technique d\'un engin (icône QR de la liste, à imprimer)', 'engins.etiquettes'],
    ];

    // code => [nouveau libellé, ancien libellé]
    private const LIBELLES = [
        'equipements.etiquettes' => [
            'Étiquettes QR des équipements (bouton « Étiquettes QR » du menu)',
            'Étiquettes QR des équipements (bouton « Étiquettes QR » du menu et icône QR de la liste)',
        ],
        'engins.etiquettes' => [
            'Étiquettes QR des engins (bouton « Étiquettes QR » du menu)',
            'Étiquettes QR des engins (bouton « Étiquettes QR » du menu et icône QR de la liste)',
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
