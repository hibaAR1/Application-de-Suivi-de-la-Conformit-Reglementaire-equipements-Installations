<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Sépare trois actions qui étaient mélangées avec d'autres permissions :
//   - Canevas + Importer (Excel)  -> equipements.importer / engins.importer
//   - Étiquettes QR (page et bouton QR des listes)
//                                 -> equipements.etiquettes / engins.etiquettes
// Pour qu'aucun compte ne perde d'accès, chaque rôle reçoit la nouvelle
// permission s'il avait déjà l'ancienne qui donnait ce droit :
//   equipements.create  -> equipements.importer
//   engins.create       -> engins.importer
//   equipements.scanner -> equipements.etiquettes
//   engins.scanner      -> engins.etiquettes
// Les libellés des permissions "Créer" sont aussi précisés.
return new class extends Migration
{
    // code => [libellé, permission dont héritent les rôles]
    private const NOUVELLES = [
        'equipements.importer' => ['Importer des équipements (boutons Canevas et Importer, avec « Créer »)', 'equipements.create'],
        'engins.importer' => ['Importer des engins (boutons Canevas et Importer, avec « Créer »)', 'engins.create'],
        'equipements.etiquettes' => ['Étiquettes QR des équipements (page et bouton QR)', 'equipements.scanner'],
        'engins.etiquettes' => ['Étiquettes QR des engins (page et bouton QR)', 'engins.scanner'],
    ];

    private const LIBELLES = [
        'equipements.create' => ['Créer un équipement (bouton « Nouvel équipement »)', 'Créer un équipement'],
        'engins.create' => ['Créer un engin (bouton « Nouvel engin »)', 'Créer un engin'],
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
