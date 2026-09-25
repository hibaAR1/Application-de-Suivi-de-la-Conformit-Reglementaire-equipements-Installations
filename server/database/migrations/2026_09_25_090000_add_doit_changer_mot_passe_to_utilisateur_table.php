<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Défaut à false pour ne pas forcer les comptes déjà en place (ex. les
        // comptes de démo du UtilisateurSeeder) à changer leur mot de passe.
        // Seuls les NOUVEAUX utilisateurs créés après cette migration seront
        // forcés au premier login — voir UtilisateurController::store().
        Schema::table('utilisateur', function (Blueprint $table) {
            $table->boolean('doit_changer_mot_passe')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('utilisateur', function (Blueprint $table) {
            $table->dropColumn('doit_changer_mot_passe');
        });
    }
};
