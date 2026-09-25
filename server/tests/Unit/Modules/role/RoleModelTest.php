<?php

namespace Tests\Unit\Modules\Role;

use App\Modules\Role\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tests\TestCase;

// Tests unitaires du modèle Role lui-même (clé primaire, champs
// assignables, relations) : aucune requête n'est exécutée (pas de
// RefreshDatabase), mais on a besoin que le framework soit démarré
// (Tests\TestCase) pour que construire un objet de relation trouve un
// connecteur de base de données, même sans jamais l'interroger.
class RoleModelTest extends TestCase
{
    public function test_la_cle_primaire_est_id_role_et_le_modele_na_pas_de_timestamps(): void
    {
        $role = new Role();

        $this->assertSame('id_role', $role->getKeyName());
        $this->assertFalse($role->timestamps);
    }

    public function test_les_champs_assignables_en_masse_sont_ceux_attendus(): void
    {
        $this->assertSame(['libelle', 'description'], (new Role())->getFillable());
    }

    public function test_les_relations_sont_du_bon_type(): void
    {
        $role = new Role();

        $this->assertInstanceOf(HasMany::class, $role->utilisateurs());
        $this->assertInstanceOf(BelongsToMany::class, $role->permissions());
    }

    public function test_la_relation_permissions_passe_bien_par_la_table_pivot_role_permission(): void
    {
        $role = new Role();

        $this->assertSame('role_permission', $role->permissions()->getTable());
    }
}
