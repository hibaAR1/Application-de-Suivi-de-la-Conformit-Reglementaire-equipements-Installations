<?php

namespace Tests\Security\Modules\Equipement;

use App\Modules\Equipement\Equipement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Equipement\EquipementTestHelpers;
use Tests\TestCase;

// Tests de SÉCURITÉ de l'API /api/equipements : personne ne doit pouvoir
// contourner l'authentification, imposer ses propres données sensibles, ou
// casser le serveur avec une entrée malveillante. Voir aussi :
// - tests/Unit/Modules/Equipement    → tests unitaires (modèle, Resource)
// - tests/Feature/Modules/Equipement → tests fonctionnels (comportement normal)
class EquipementSecurityTest extends TestCase
{
    use RefreshDatabase;
    use EquipementTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerEquipementDeTest();
    }

    // --- Authentification obligatoire -------------------------------------

    public function test_lister_les_equipements_necessite_une_authentification(): void
    {
        $this->getJson('/api/equipements')->assertStatus(401);
    }

    public function test_creer_un_equipement_necessite_une_authentification(): void
    {
        $this->postJson('/api/equipements', $this->payloadValide())->assertStatus(401);
    }

    public function test_supprimer_un_equipement_necessite_une_authentification(): void
    {
        $equipement = Equipement::create(array_merge($this->payloadValide(), [
            'id_equipement' => 'TEST-001', 'referentiel' => 'TEST-001', 'statut' => 'Conforme',
        ]));

        $this->deleteJson("/api/equipements/{$equipement->id_equipement}")->assertStatus(401);
    }

    // --- Le client ne peut pas imposer des données sensibles --------------

    public function test_lidentifiant_envoye_par_le_client_est_ignore(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/equipements', $this->payloadValide([
            'id_equipement' => 'ID-IMPOSE-PAR-LE-CLIENT',
            'referentiel' => 'ID-IMPOSE-PAR-LE-CLIENT',
        ]));

        $response->assertStatus(201);
        $this->assertNotSame('ID-IMPOSE-PAR-LE-CLIENT', $response->json('id_equipement'));
    }

    // --- Entrées malveillantes ---------------------------------------------

    public function test_un_filtre_de_filiale_malveillant_ne_casse_rien_et_ne_renvoie_rien(): void
    {
        $this->seConnecter();

        Equipement::create(array_merge($this->payloadValide(), [
            'id_equipement' => 'TEST-001', 'referentiel' => 'TEST-001', 'statut' => 'Conforme',
        ]));

        // Eloquent lie ce paramètre via un bind, il n'est jamais concaténé
        // dans le SQL : ceci doit rester une simple recherche sans résultat,
        // pas une erreur serveur ni une suppression de données.
        $response = $this->getJson('/api/equipements?'.http_build_query([
            'id_filiale' => "1; DROP TABLE equipement; --",
        ]));

        $response->assertStatus(200)->assertJsonCount(0);
        $this->assertDatabaseHas('equipement', ['id_equipement' => 'TEST-001']);
    }
}
