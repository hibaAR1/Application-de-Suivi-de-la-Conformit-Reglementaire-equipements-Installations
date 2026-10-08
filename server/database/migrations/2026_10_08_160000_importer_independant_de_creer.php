<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// "Importer" (boutons Canevas et Importer) devient une permission à part
// entière : elle n'a plus besoin de "Créer" pour fonctionner. Seuls les
// libellés changent ici ; les liens avec les rôles ne bougent pas.
return new class extends Migration
{
    // code => [nouveau libellé, ancien libellé]
    private const LIBELLES = [
        'equipements.importer' => [
            'Importer des équipements par fichier Excel (boutons Canevas et Importer)',
            'Importer des équipements (boutons Canevas et Importer, avec « Créer »)',
        ],
        'engins.importer' => [
            'Importer des engins par fichier Excel (boutons Canevas et Importer)',
            'Importer des engins (boutons Canevas et Importer, avec « Créer »)',
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
