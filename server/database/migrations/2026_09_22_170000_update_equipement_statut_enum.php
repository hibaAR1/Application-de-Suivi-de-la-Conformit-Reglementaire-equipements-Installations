<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Remplace les anciens statuts (En service / Hors service / En réserve / Réformé)
// par les 3 nouveaux demandés : Conforme / Non conforme / Non conforme avec réserve.
// SQL Server crée la contrainte CHECK de l'enum() avec un nom généré automatiquement
// (pas "equipement_statut_check"), donc on la retrouve dynamiquement pour la supprimer,
// pareil pour la contrainte DEFAULT, avant de migrer les données existantes.
return new class extends Migration
{
    public function up(): void
    {
        // 1) Supprime la contrainte CHECK existante sur equipement.statut
        DB::statement("
            DECLARE @nom NVARCHAR(200)
            SELECT @nom = cc.name
            FROM sys.check_constraints cc
            JOIN sys.columns col
                ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
            WHERE cc.parent_object_id = OBJECT_ID('equipement') AND col.name = 'statut'
            IF @nom IS NOT NULL
                EXEC('ALTER TABLE equipement DROP CONSTRAINT ' + @nom)
        ");

        // 2) Supprime la contrainte DEFAULT existante sur equipement.statut
        DB::statement("
            DECLARE @nom NVARCHAR(200)
            SELECT @nom = dc.name
            FROM sys.default_constraints dc
            JOIN sys.columns col
                ON dc.parent_object_id = col.object_id AND dc.parent_column_id = col.column_id
            WHERE dc.parent_object_id = OBJECT_ID('equipement') AND col.name = 'statut'
            IF @nom IS NOT NULL
                EXEC('ALTER TABLE equipement DROP CONSTRAINT ' + @nom)
        ");

        // 3) Convertit les valeurs existantes vers les 3 nouveaux statuts
        DB::table('equipement')->where('statut', 'En service')->update(['statut' => 'Conforme']);
        DB::table('equipement')->where('statut', 'En réserve')->update(['statut' => 'Conforme avec réserve']);
        DB::table('equipement')->whereIn('statut', ['Hors service', 'Réformé'])->update(['statut' => 'Non conforme']);

        // 4) Ajoute les nouvelles contraintes DEFAULT et CHECK, avec des noms explicites
        DB::statement("ALTER TABLE equipement ADD CONSTRAINT DF_equipement_statut DEFAULT N'Conforme' FOR statut");
        DB::statement("ALTER TABLE equipement ADD CONSTRAINT CK_equipement_statut CHECK (statut IN (N'Conforme', N'Conforme avec réserve', N'Non conforme'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE equipement DROP CONSTRAINT CK_equipement_statut");
        DB::statement("ALTER TABLE equipement DROP CONSTRAINT DF_equipement_statut");

        DB::table('equipement')->where('statut', 'Conforme')->update(['statut' => 'En service']);
        DB::table('equipement')->where('statut', 'Conforme avec réserve')->update(['statut' => 'En réserve']);
        DB::table('equipement')->where('statut', 'Non conforme')->update(['statut' => 'Hors service']);

        DB::statement("ALTER TABLE equipement ADD CONSTRAINT DF_equipement_statut DEFAULT N'En service' FOR statut");
        DB::statement("ALTER TABLE equipement ADD CONSTRAINT CK_equipement_statut CHECK (statut IN (N'En service', N'Hors service', N'En réserve', N'Réformé'))");
    }
};
