<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Permissions par onglet de la fiche (équipements et engins) :
//   - Rapports  : equipements.rapports, engins.rapports (avant : "Modifier")
//   - Assistant : equipements.assistant, engins.assistant (avant : aucune)
// Pour qu'aucun compte ne perde d'accès :
//   - chaque rôle qui avait equipements.edit / engins.edit reçoit .rapports
//   - chaque rôle qui avait equipements.ouvrir / engins.ouvrir reçoit .assistant
// Les libellés des autres permissions de la fiche sont aussi précisés.
return new class extends Migration
{
    // code => [libellé, permission dont héritent les rôles]
    private const NOUVELLES = [
        'equipements.rapports' => ['Fiche · Rapports : ajouter un rapport', 'equipements.edit'],
        'engins.rapports' => ['Fiche · Rapports : ajouter un rapport', 'engins.edit'],
        'equipements.assistant' => ['Fiche · Assistant IA : utiliser l\'assistant', 'equipements.ouvrir'],
        'engins.assistant' => ['Fiche · Assistant IA : utiliser l\'assistant', 'engins.ouvrir'],
    ];

    // code => [nouveau libellé, ancien libellé]
    private const LIBELLES = [
        'equipements.ouvrir' => [
            'Ouvrir la fiche d\'un équipement (bouton Ouvrir, voir les onglets)',
            'Ouvrir la fiche d\'un équipement (bouton Ouvrir)',
        ],
        'engins.ouvrir' => [
            'Ouvrir la fiche d\'un engin (bouton Ouvrir, voir les onglets)',
            'Ouvrir la fiche d\'un engin (bouton Ouvrir)',
        ],
        'equipements.edit' => [
            'Modifier un équipement (bouton ✎, onglets Informations et Caractéristiques)',
            'Modifier un équipement',
        ],
        'engins.edit' => [
            'Modifier un engin (bouton ✎, onglets Informations et Caractéristiques)',
            'Modifier un engin',
        ],
        'controles.create' => [
            'Fiche · Réserves : ajouter une réserve (et dernier contrôle du formulaire)',
            'Ajouter une réserve et saisir le dernier contrôle d\'un équipement',
        ],
        'engins.controler' => [
            'Fiche · Réserves : ajouter une réserve (et dernier contrôle du formulaire)',
            'Ajouter une réserve et saisir le dernier contrôle d\'un engin',
        ],
        'reserves.lever' => [
            'Fiche · Réserves : lever une réserve',
            'Lever une réserve d\'équipement',
        ],
        'engins.lever_reserve' => [
            'Fiche · Réserves : lever une réserve',
            'Lever une réserve d\'engin',
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
