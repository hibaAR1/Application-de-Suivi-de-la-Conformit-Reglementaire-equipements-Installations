<?php

namespace Tests\Unit\Modules\Utilisateur;

use App\Modules\Permission\Permission;
use App\Modules\Role\Role;
use App\Modules\Utilisateur\Utilisateur;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Tests\TestCase;

// Tests unitaires du modèle Utilisateur lui-même (clé primaire, champs
// cachés/castés, relations, hasPermission()) : aucune requête n'est
// exécutée (pas de RefreshDatabase), mais on a besoin que le framework soit
// démarré (Tests\TestCase) pour que construire un objet de relation trouve
// un connecteur de base de données, même sans jamais l'interroger.
class UtilisateurModelTest extends TestCase
{
    public function test_la_cle_primaire_est_id_utilisateur_et_le_modele_na_pas_de_timestamps(): void
    {
        $utilisateur = new Utilisateur();

        $this->assertSame('id_utilisateur', $utilisateur->getKeyName());
        $this->assertFalse($utilisateur->timestamps);
    }

    public function test_le_mot_de_passe_est_cache_du_tableau_serialise(): void
    {
        $utilisateur = new Utilisateur();
        $utilisateur->mot_de_passe = 'peu-importe-hache';

        $this->assertArrayNotHasKey('mot_de_passe', $utilisateur->toArray());
    }

    public function test_actif_et_doit_changer_mot_passe_sont_bien_castes_en_booleen(): void
    {
        $utilisateur = new Utilisateur();
        $utilisateur->actif = 1;
        $utilisateur->doit_changer_mot_passe = 0;

        $this->assertIsBool($utilisateur->actif);
        $this->assertTrue($utilisateur->actif);
        $this->assertIsBool($utilisateur->doit_changer_mot_passe);
        $this->assertFalse($utilisateur->doit_changer_mot_passe);
    }

    public function test_les_champs_assignables_en_masse_sont_ceux_attendus(): void
    {
        $attendus = ['nom', 'email', 'mot_de_passe', 'id_filiale', 'id_role', 'actif', 'doit_changer_mot_passe'];

        $this->assertSame($attendus, (new Utilisateur())->getFillable());
    }

    public function test_les_relations_sont_du_bon_type(): void
    {
        $utilisateur = new Utilisateur();

        $this->assertInstanceOf(BelongsTo::class, $utilisateur->role());
        $this->assertInstanceOf(BelongsTo::class, $utilisateur->filiale());
        $this->assertInstanceOf(BelongsToMany::class, $utilisateur->filiales());
    }

    // --- hasPermission() ---------------------------------------------------

    public function test_haspermission_est_vrai_quand_le_role_a_la_permission(): void
    {
        $role = new Role();
        $permission = new Permission(['code' => 'equipements.view']);
        // On simule la relation chargée, sans toucher à la base de données.
        $role->setRelation('permissions', collect([$permission]));

        $utilisateur = new Utilisateur();
        $utilisateur->setRelation('role', $role);

        $this->assertTrue($utilisateur->hasPermission('equipements.view'));
        $this->assertFalse($utilisateur->hasPermission('utilisateurs.manage'));
    }

    public function test_haspermission_est_faux_quand_lutilisateur_na_pas_de_role(): void
    {
        $utilisateur = new Utilisateur();
        $utilisateur->setRelation('role', null);

        $this->assertFalse($utilisateur->hasPermission('equipements.view'));
    }
}
