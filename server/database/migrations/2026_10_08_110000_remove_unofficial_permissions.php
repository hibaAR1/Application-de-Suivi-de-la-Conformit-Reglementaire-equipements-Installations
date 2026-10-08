<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Les permissions ne se créent plus depuis l'interface : seules celles qui sont
// reliées au code existent (PermissionSeeder.php). Cette migration supprime
// toute permission de la base qui n'est pas dans cette liste officielle
// (par exemple les permissions de test créées à la main). Les liens avec les
// rôles disparaissent avec elles (cascade).
return new class extends Migration
{
    private const OFFICIELLES = [
        'equipements.view', 'equipements.create', 'equipements.edit',
        'equipements.delete', 'equipements.scanner',
        'controles.create', 'reserves.lever',
        'dashboard.filiale.view', 'dashboard.groupe.view',
        'engins.view', 'engins.create', 'engins.edit', 'engins.delete',
        'engins.controler', 'engins.lever_reserve', 'engins.scanner',
        'utilisateurs.view', 'utilisateurs.create', 'utilisateurs.edit', 'utilisateurs.delete',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'donnees_base.view', 'donnees_base.create', 'donnees_base.edit', 'donnees_base.delete',
    ];

    public function up(): void
    {
        DB::table('permission')->whereNotIn('code', self::OFFICIELLES)->delete();
    }

    public function down(): void
    {
        // Les permissions supprimées étaient des permissions de test : rien à
        // restaurer.
    }
};
