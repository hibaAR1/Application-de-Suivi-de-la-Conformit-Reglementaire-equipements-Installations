<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Libellés plus clairs pour dire où agit chaque permission :
//   - Scanner et Étiquettes QR : boutons du menu (pages à part)
//   - Contrôle : bouton « + Ajouter une réserve » de la fiche et bloc
//     « Dernier contrôle » du formulaire
// Seuls les libellés changent ; les liens avec les rôles ne bougent pas.
return new class extends Migration
{
    // code => [nouveau libellé, ancien libellé]
    private const LIBELLES = [
        'equipements.scanner' => [
            'Scanner les équipements (bouton « Scanner QR Code » du menu)',
            'Scanner un équipement (QR code)',
        ],
        'engins.scanner' => [
            'Scanner les engins (bouton « Scanner QR Code » du menu)',
            'Scanner un engin (QR code)',
        ],
        'equipements.etiquettes' => [
            'Étiquettes QR des équipements (bouton « Étiquettes QR » du menu et icône QR de la liste)',
            'Étiquettes QR des équipements (page et bouton QR)',
        ],
        'engins.etiquettes' => [
            'Étiquettes QR des engins (bouton « Étiquettes QR » du menu et icône QR de la liste)',
            'Étiquettes QR des engins (page et bouton QR)',
        ],
        'controles.create' => [
            'Ajouter une réserve et saisir le dernier contrôle d\'un équipement',
            'Enregistrer un contrôle d\'équipement',
        ],
        'engins.controler' => [
            'Ajouter une réserve et saisir le dernier contrôle d\'un engin',
            'Enregistrer un contrôle d\'engin',
        ],
    ];

    public function up(): void
    {
        foreach (self::LIBELLES as $code => [$nouveau]) {
            DB::table('permission')->where('code', $code)->update(['libelle' => $nouveau]);
        }
    }

    public function down(): void
    {
        foreach (self::LIBELLES as $code => [, $ancien]) {
            DB::table('permission')->where('code', $code)->update(['libelle' => $ancien]);
        }
    }
};
