<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Précise dans le nom de deux permissions qu'elles concernent les équipements
// (les engins ont leurs propres permissions : engins.controler et
// engins.lever_reserve). Seul le texte affiché change, pas le code.
return new class extends Migration
{
    private const LIBELLES = [
        'controles.create' => 'Enregistrer un contrôle d\'équipement',
        'reserves.lever' => 'Lever une réserve d\'équipement',
    ];

    public function up(): void
    {
        foreach (self::LIBELLES as $code => $libelle) {
            DB::table('permission')->where('code', $code)->update(['libelle' => $libelle]);
        }
    }

    public function down(): void
    {
        DB::table('permission')->where('code', 'controles.create')->update(['libelle' => 'Enregistrer un contrôle']);
        DB::table('permission')->where('code', 'reserves.lever')->update(['libelle' => 'Lever une réserve']);
    }
};
