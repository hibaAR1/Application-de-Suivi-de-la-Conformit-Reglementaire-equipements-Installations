<?php

namespace Tests\Feature\Modules\Equipement;

use App\Modules\Controle\Controle;
use App\Modules\Equipement\Equipement;
use App\Modules\Filiale\Filiale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Modules\Equipement\EquipementTestHelpers;
use Tests\TestCase;

// Tests FONCTIONNELS de l'API /api/equipements : le comportement attendu
// quand tout se passe normalement (création, lecture, modification,
// suppression, validation). Voir aussi :
// - tests/Unit/Modules/Equipement     → tests unitaires (modèle, Resource)
// - tests/Security/Modules/Equipement → tests de sécurité (authentification,
//   entrées malveillantes, données imposées par le client)
class EquipementApiTest extends TestCase
{
    use RefreshDatabase;
    use EquipementTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->preparerEquipementDeTest();
    }

    // --- Lecture ---------------------------------------------------------

    public function test_la_liste_retourne_les_equipements_avec_leurs_relations(): void
    {
        $this->seConnecter();

        Equipement::create(array_merge($this->payloadValide(), [
            'id_equipement' => 'TEST-001', 'referentiel' => 'TEST-001', 'statut' => 'Conforme',
        ]));

        $response = $this->getJson('/api/equipements');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id_equipement', 'TEST-001')
            ->assertJsonPath('0.filiale.code', 'CTM')
            ->assertJsonPath('0.site.code', '201')
            ->assertJsonPath('0.type_equipement.libelle', 'Chariot Élévateur')
            ->assertJsonStructure([['id_equipement', 'controles', 'filiale', 'site', 'type_equipement']]);
    }

    public function test_la_liste_peut_etre_filtree_par_filiale(): void
    {
        $this->seConnecter();

        $autreFiliale = Filiale::where('code', 'MP')->firstOrFail();

        Equipement::create(array_merge($this->payloadValide(), [
            'id_equipement' => 'CTM-001', 'referentiel' => 'CTM-001', 'statut' => 'Conforme',
        ]));
        Equipement::create(array_merge($this->payloadValide(['id_filiale' => $autreFiliale->id_filiale, 'id_site' => null]), [
            'id_equipement' => 'MP-001', 'referentiel' => 'MP-001', 'statut' => 'Conforme',
        ]));

        $response = $this->getJson('/api/equipements?id_filiale='.$this->filiale->id_filiale);

        $response->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.id_equipement', 'CTM-001');
    }

    public function test_un_equipement_inexistant_retourne_404(): void
    {
        $this->seConnecter();

        $this->getJson('/api/equipements/EQUIPEMENT-INEXISTANT')->assertStatus(404);
    }

    // --- Création ----------------------------------------------------------

    public function test_la_creation_genere_un_identifiant_au_bon_format(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/equipements', $this->payloadValide());

        $response->assertStatus(201)
            ->assertJsonPath('id_equipement', 'CTM-201-CHAR-01')
            ->assertJsonPath('referentiel', 'CTM-201-CHAR-01')
            ->assertJsonPath('statut', 'Conforme'); // valeur par défaut appliquée par le contrôleur
    }

    public function test_la_creation_echoue_si_des_champs_obligatoires_manquent(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/equipements', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_filiale', 'id_type_equipement', 'designation', 'numero_serie', 'date_mise_en_service']);
    }

    public function test_la_creation_echoue_si_le_numero_de_serie_existe_deja(): void
    {
        $this->seConnecter();

        $this->postJson('/api/equipements', $this->payloadValide(['numero_serie' => 'SN-DUPLIQUE']))
            ->assertStatus(201);

        $this->postJson('/api/equipements', $this->payloadValide(['numero_serie' => 'SN-DUPLIQUE']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['numero_serie']);
    }

    public function test_un_statut_hors_liste_autorisee_est_rejete(): void
    {
        $this->seConnecter();

        $this->postJson('/api/equipements', $this->payloadValide(['statut' => 'Statut Invente']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['statut']);
    }

    // --- Modification --------------------------------------------------------

    public function test_la_modification_met_a_jour_les_champs_fournis(): void
    {
        $this->seConnecter();

        $equipement = Equipement::create(array_merge($this->payloadValide(), [
            'id_equipement' => 'TEST-001', 'referentiel' => 'TEST-001', 'statut' => 'Conforme',
        ]));

        $response = $this->putJson("/api/equipements/{$equipement->id_equipement}", [
            'designation' => 'Chariot élévateur renommé',
        ]);

        $response->assertStatus(200)->assertJsonPath('designation', 'Chariot élévateur renommé');
        $this->assertSame('Chariot élévateur renommé', $equipement->fresh()->designation);
    }

    public function test_la_modification_autorise_a_garder_son_propre_numero_de_serie(): void
    {
        $this->seConnecter();

        $equipement = Equipement::create(array_merge($this->payloadValide(['numero_serie' => 'SN-INCHANGE']), [
            'id_equipement' => 'TEST-001', 'referentiel' => 'TEST-001', 'statut' => 'Conforme',
        ]));

        // La règle Rule::unique(...)->ignore($id) ne doit pas rejeter
        // l'équipement quand on lui renvoie son propre numéro de série.
        $this->putJson("/api/equipements/{$equipement->id_equipement}", [
            'numero_serie' => 'SN-INCHANGE',
        ])->assertStatus(200);
    }

    // --- Suppression -----------------------------------------------------

    public function test_la_suppression_supprime_aussi_les_controles_associes(): void
    {
        $this->seConnecter();

        $equipement = Equipement::create(array_merge($this->payloadValide(), [
            'id_equipement' => 'TEST-001', 'referentiel' => 'TEST-001', 'statut' => 'Conforme',
        ]));
        $controle = Controle::create([
            'id_equipement' => $equipement->id_equipement,
            'date_controle' => '2026-01-15',
            'organisme_controle' => 'Bureau Veritas',
            'resultat_global' => 'Favorable',
            'prochaine_echeance' => '2027-01-15',
            'id_utilisateur_auteur' => $this->utilisateur->id_utilisateur,
        ]);

        $this->deleteJson("/api/equipements/{$equipement->id_equipement}")->assertStatus(200);

        $this->assertDatabaseMissing('equipement', ['id_equipement' => 'TEST-001']);
        $this->assertDatabaseMissing('controle', ['id_controle' => $controle->id_controle]);
    }
}
