<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// La périodicité de contrôle est désormais saisie directement sur chaque
// équipement (plus seulement héritée du type) : plus fiable, et corrige au
// passage ControleController::store, qui lisait déjà $equipement->periodicite_mois
// pour calculer la prochaine échéance — une colonne qui n'existait pas encore,
// donc "prochaine échéance" valait toujours "date du contrôle" (+0 mois).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipement', function (Blueprint $table) {
            $table->integer('periodicite_mois')->nullable()->after('date_mise_en_service');
        });
    }

    public function down(): void
    {
        Schema::table('equipement', function (Blueprint $table) {
            $table->dropColumn('periodicite_mois');
        });
    }
};
