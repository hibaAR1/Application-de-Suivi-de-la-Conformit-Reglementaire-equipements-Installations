<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Crée les permissions propres aux engins (engins.*), séparées de celles des
// équipements. Chaque rôle reçoit les permissions "engins" qui correspondent à
// ce qu'il avait déjà côté équipements, pour qu'aucun compte ne perde d'accès :
//   equipements.view   -> engins.view
//   equipements.create -> engins.create
//   equipements.edit   -> engins.edit
//   equipements.delete -> engins.delete
//   controles.create   -> engins.controler
//   reserves.lever     -> engins.lever_reserve
//   equipements.scanner -> engins.scanner
return new class extends Migration
{
    // code de la nouvelle permission => [libellé, permission équivalente existante]
    private const ENGINS = [
        'engins.view'          => ['Voir les engins', 'equipements.view'],
        'engins.create'        => ['Créer un engin', 'equipements.create'],
        'engins.edit'          => ['Modifier un engin', 'equipements.edit'],
        'engins.delete'        => ['Supprimer un engin', 'equipements.delete'],
        'engins.controler'     => ["Enregistrer un contrôle d'engin", 'controles.create'],
        'engins.lever_reserve' => ["Lever une réserve d'engin", 'reserves.lever'],
        'engins.scanner'       => ['Scanner un engin (QR code)', 'equipements.scanner'],
    ];

    public function up(): void
    {
        foreach (self::ENGINS as $code => [$libelle, $equivalent]) {
            $id = DB::table('permission')->where('code', $code)->value('id_permission')
                ?? DB::table('permission')->insertGetId(
                    ['code' => $code, 'libelle' => $libelle],
                    'id_permission'
                );

            $idEquivalent = DB::table('permission')->where('code', $equivalent)->value('id_permission');
            if (!$idEquivalent) {
                continue;
            }

            $roles = DB::table('role_permission')->where('id_permission', $idEquivalent)->pluck('id_role');
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
    }

    public function down(): void
    {
        // Les liens avec les rôles disparaissent avec les permissions (cascade).
        DB::table('permission')->whereIn('code', array_keys(self::ENGINS))->delete();
    }
};
