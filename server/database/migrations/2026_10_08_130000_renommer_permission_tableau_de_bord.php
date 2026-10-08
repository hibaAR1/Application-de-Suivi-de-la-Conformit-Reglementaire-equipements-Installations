<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Le tableau de bord est unique (il n'y a plus de tableau "consolidé" à part).
// La permission dashboard.groupe.view sert à voir les données de TOUTES les
// filiales ; sans elle, l'utilisateur ne voit que sa filiale. Seul le texte
// affiché change, pas le code.
return new class extends Migration
{
    public function up(): void
    {
        DB::table('permission')
            ->where('code', 'dashboard.groupe.view')
            ->update(['libelle' => 'Voir le tableau de bord de toutes les filiales']);
    }

    public function down(): void
    {
        DB::table('permission')
            ->where('code', 'dashboard.groupe.view')
            ->update(['libelle' => 'Voir le tableau de bord consolidé Groupe']);
    }
};
