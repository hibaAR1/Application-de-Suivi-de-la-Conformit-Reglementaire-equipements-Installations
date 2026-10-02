<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Renomme les valeurs de reserve.niveau_criticite et reserve.statut, à la demande
// d'Hiba, pour la nouvelle page "Réserves & Plan d'action" :
//   - niveau_criticite : "Bloquante" -> "Critique" (Mineure/Majeure inchangés)
//   - statut : on passe de 4 valeurs à 3 — "Levée" -> "Clôturée",
//     et "En retard" -> "Ouverte" (le retard sera désormais affiché en comparant
//     la date limite à aujourd'hui, plutôt que stocké comme statut à part).
// Même principe que la migration 2026_09_22_170000_update_equipement_statut_enum :
// SQL Server nomme ses contraintes CHECK/DEFAULT automatiquement, donc on les
// retrouve dynamiquement avant de les supprimer. Branche "sinon" pour que SQLite
// (tests PHPUnit) reproduise le même résultat sans la syntaxe SQL Server.
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            Schema::table('reserve', function (Blueprint $table) {
                $table->string('niveau_criticite')->change();
                $table->string('statut')->default('Ouverte')->change();
            });

            DB::table('reserve')->where('niveau_criticite', 'Bloquante')->update(['niveau_criticite' => 'Critique']);
            DB::table('reserve')->where('statut', 'Levée')->update(['statut' => 'Clôturée']);
            DB::table('reserve')->where('statut', 'En retard')->update(['statut' => 'Ouverte']);

            return;
        }

        // 1) Supprime la contrainte CHECK existante sur reserve.niveau_criticite
        DB::statement("
            DECLARE @nom NVARCHAR(200)
            SELECT @nom = cc.name
            FROM sys.check_constraints cc
            JOIN sys.columns col
                ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
            WHERE cc.parent_object_id = OBJECT_ID('reserve') AND col.name = 'niveau_criticite'
            IF @nom IS NOT NULL
                EXEC('ALTER TABLE reserve DROP CONSTRAINT ' + @nom)
        ");

        // 2) Supprime la contrainte CHECK existante sur reserve.statut
        DB::statement("
            DECLARE @nom NVARCHAR(200)
            SELECT @nom = cc.name
            FROM sys.check_constraints cc
            JOIN sys.columns col
                ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
            WHERE cc.parent_object_id = OBJECT_ID('reserve') AND col.name = 'statut'
            IF @nom IS NOT NULL
                EXEC('ALTER TABLE reserve DROP CONSTRAINT ' + @nom)
        ");

        // 3) Supprime la contrainte DEFAULT existante sur reserve.statut
        DB::statement("
            DECLARE @nom NVARCHAR(200)
            SELECT @nom = dc.name
            FROM sys.default_constraints dc
            JOIN sys.columns col
                ON dc.parent_object_id = col.object_id AND dc.parent_column_id = col.column_id
            WHERE dc.parent_object_id = OBJECT_ID('reserve') AND col.name = 'statut'
            IF @nom IS NOT NULL
                EXEC('ALTER TABLE reserve DROP CONSTRAINT ' + @nom)
        ");

        // 4) Convertit les valeurs existantes
        DB::table('reserve')->where('niveau_criticite', 'Bloquante')->update(['niveau_criticite' => 'Critique']);
        DB::table('reserve')->where('statut', 'Levée')->update(['statut' => 'Clôturée']);
        DB::table('reserve')->where('statut', 'En retard')->update(['statut' => 'Ouverte']);

        // 5) Ajoute les nouvelles contraintes, avec des noms explicites
        DB::statement("ALTER TABLE reserve ADD CONSTRAINT CK_reserve_niveau_criticite CHECK (niveau_criticite IN (N'Mineure', N'Majeure', N'Critique'))");
        DB::statement("ALTER TABLE reserve ADD CONSTRAINT DF_reserve_statut DEFAULT N'Ouverte' FOR statut");
        DB::statement("ALTER TABLE reserve ADD CONSTRAINT CK_reserve_statut CHECK (statut IN (N'Ouverte', N'En cours', N'Clôturée'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            Schema::table('reserve', function (Blueprint $table) {
                $table->string('niveau_criticite')->change();
                $table->string('statut')->default('Ouverte')->change();
            });

            DB::table('reserve')->where('niveau_criticite', 'Critique')->update(['niveau_criticite' => 'Bloquante']);
            DB::table('reserve')->where('statut', 'Clôturée')->update(['statut' => 'Levée']);

            return;
        }

        DB::statement("ALTER TABLE reserve DROP CONSTRAINT CK_reserve_statut");
        DB::statement("ALTER TABLE reserve DROP CONSTRAINT DF_reserve_statut");
        DB::statement("ALTER TABLE reserve DROP CONSTRAINT CK_reserve_niveau_criticite");

        // "En retard" n'est pas restitué (fusionné dans "Ouverte" lors du up()) :
        // cette information est perdue, comme pour toute migration down() qui
        // défait une fusion de valeurs.
        DB::table('reserve')->where('niveau_criticite', 'Critique')->update(['niveau_criticite' => 'Bloquante']);
        DB::table('reserve')->where('statut', 'Clôturée')->update(['statut' => 'Levée']);

        DB::statement("ALTER TABLE reserve ADD CONSTRAINT DF_reserve_statut DEFAULT N'Ouverte' FOR statut");
        DB::statement("ALTER TABLE reserve ADD CONSTRAINT CK_reserve_niveau_criticite CHECK (niveau_criticite IN (N'Mineure', N'Majeure', N'Bloquante'))");
        DB::statement("ALTER TABLE reserve ADD CONSTRAINT CK_reserve_statut CHECK (statut IN (N'Ouverte', N'En cours', N'Levée', N'En retard'))");
    }
};
