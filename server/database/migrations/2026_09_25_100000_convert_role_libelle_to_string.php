<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // "role.libelle" était un ENUM figé sur les 5 rôles du CDC (impossible
    // d'en créer un 6e). On le convertit en simple chaîne pour permettre la
    // création de rôles personnalisés depuis l'appli (gestion des rôles).
    public function up(): void
    {
        // SQL Server refuse d'altérer une colonne tant qu'un index est
        // dépendant dessus (ici l'index unique créé par ->unique() dans la
        // migration d'origine) : on le retire, on change la colonne, on le
        // remet.
        Schema::table('role', function (Blueprint $table) {
            $table->dropUnique('role_libelle_unique');
        });

        Schema::table('role', function (Blueprint $table) {
            $table->string('libelle', 150)->change();
            $table->text('description')->nullable();
        });

        Schema::table('role', function (Blueprint $table) {
            $table->unique('libelle');
        });
    }

    public function down(): void
    {
        Schema::table('role', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
