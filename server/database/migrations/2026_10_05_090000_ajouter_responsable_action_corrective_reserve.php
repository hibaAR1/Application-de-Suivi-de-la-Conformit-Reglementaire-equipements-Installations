<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Ajoute deux champs à la réserve, à la demande d'Hiba, pour coller à sa
// maquette d'origine du formulaire "Ajouter une réserve" (Description /
// Gravité / Échéance / Responsable / Action corrective) : jusqu'ici seuls
// nature_reserve (Description) et niveau_criticite (Gravité) existaient.
// Champs simples (pas d'ENUM/CHECK), donc pas besoin de la gymnastique
// SQL Server utilisée dans 2026_10_02_140000_renommer_valeurs_reserve.php.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reserve', function (Blueprint $table) {
            $table->string('responsable')->nullable()->after('niveau_criticite');
            $table->text('action_corrective')->nullable()->after('responsable');
        });
    }

    public function down(): void
    {
        Schema::table('reserve', function (Blueprint $table) {
            $table->dropColumn(['responsable', 'action_corrective']);
        });
    }
};
