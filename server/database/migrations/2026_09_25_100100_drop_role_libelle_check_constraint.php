<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // La migration précédente (convert_role_libelle_to_string) a bien changé
    // le TYPE de la colonne "libelle" en nvarchar(150), mais sur SQL Server
    // ça ne supprime pas la contrainte CHECK posée par l'ENUM d'origine
    // (créée automatiquement par Laravel, avec un nom généré par le moteur
    // du type "CK__role__libelle__xxxxxxxx" qui varie selon l'environnement
    // — donc on ne peut pas le coder en dur, on le retrouve dynamiquement).
    public function up(): void
    {
        // Cette contrainte est une particularité de SQL Server (voir plus
        // haut) : sur tout autre moteur — notamment SQLite en mémoire,
        // utilisé par les tests Unit/Feature/Security (voir phpunit.xml) —
        // cette migration ne doit rien faire, sous peine de plantage au
        // moment où RefreshDatabase rejoue toutes les migrations avant
        // chaque suite de tests.
        if (DB::connection()->getDriverName() !== 'sqlsrv') {
            return;
        }

        DB::statement("
            DECLARE @constraintName nvarchar(200);
            SELECT @constraintName = cc.name
            FROM sys.check_constraints cc
            JOIN sys.columns c
                ON cc.parent_object_id = c.object_id
                AND cc.parent_column_id = c.column_id
            WHERE cc.parent_object_id = OBJECT_ID('role')
                AND c.name = 'libelle';

            IF @constraintName IS NOT NULL
                EXEC('ALTER TABLE role DROP CONSTRAINT ' + @constraintName);
        ");
    }

    public function down(): void
    {
        // Contrainte issue de l'ENUM d'origine, volontairement non recréée :
        // une fois des rôles personnalisés créés, revenir à une liste figée
        // de 5 valeurs casserait les données.
    }
};
