<?php

namespace Tests\Feature\Modules\Equipement;

use App\Modules\Controle\Controle;
use App\Modules\Equipement\Equipement;
use App\Modules\Filiale\Filiale;
use App\Modules\Site\Site;
use App\Modules\TypeEquipement\TypeEquipement;
use App\Modules\Utilisateur\Utilisateur;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Tests fonctionnels + sécurité de l'API /api/equipements (voir aussi
// tests/Unit/Modules/Equipement pour les tests unitaires du modèle et
// de la Resource). Couvre : authentification, validation des données,
// génération de l'identifiant, unicité, filtrage, suppression en
// cascade, et robustesse face à des entrées malveillantes.
class EquipementApiTest extends TestCase
{
    use RefreshDatabase;

    private Filiale $filiale;
    private Site $site;
    private TypeEquipement $type;
    private Utilisateur $utilisateur;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        $this->filiale = Filiale::where('code', 'CTM')->firstOrFail();
        $this->site = Site::where('id_filiale', $this->filiale->id_filiale)->where('code', '201')->firstOrFail();
        $this->type = TypeEquipement::where('libelle', 'Chariot Élévateur')->firstOrFail();
        $this->utilisateur = Utilisateur::where('email', 'admin@menara-holding.ma')->firstOrFail();
    }

    // S'authentifie via le vrai flux de connexion (POST /api/login) plutôt
    // qu'un faux utilisateur injecté directement dans le guard : ça exerce
    // le même chemin que le frontend, et évite de dépendre du modèle
    // Utilisateur pour l'interface Authenticatable de Laravel (que la
    // connexion réelle par token n'exige pas, mais que le raccourci de test
    // Sanctum::actingAs() exige, lui, strictement).
    private function seConnecter(): void
    {
        $token = $this->postJson('/api/login', [
            'email' => $this->utilisateur->email,
            'mot_de_passe' => 'MenaraAdmin2026!',
        ])->json('token');

        $this->assertIsString($token, 'La connexion de test a échoué, impossible de récupérer un token.');

        $this->withHeader('Authorization', "Bearer {$token}");
    }

    private function payloadValide(array $overrides = []): array
    {
        return array_merge([
            'id_filiale' => $this->filiale->id_filiale,
            'id_site' => $this->site->id_site,
            'id_type_equipement' => $this->type->id_type_equipement,
            'designation' => 'Chariot élévateur n°1',
            'numero_serie' => 'SN-'.uniqid(),
            'date_mise_en_service' => '2026-01-01',
        ], $overrides);
    }

    // --- Sécurité : authentification ---------------------------------

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

    // --- Fonctionnel : lecture -----------------------------------------

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
            ->assertJsonPath('0.typeEquipement.libelle', 'Chariot Élévateur')
            ->assertJsonStructure([['id_equipement', 'controles', 'filiale', 'site', 'typeEquipement']]);
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

    // --- Fonctionnel : création -----------------------------------------

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

    // --- Sécurité : le client ne peut pas imposer l'identifiant ---------

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

    // --- Fonctionnel : modification --------------------------------------

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

    // --- Fonctionnel : suppression ---------------------------------------

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

    // --- Sécurité : entrées malveillantes --------------------------------

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

    public function test_un_statut_hors_liste_autorisee_est_rejete(): void
    {
        $this->seConnecter();

        $this->postJson('/api/equipements', $this->payloadValide(['statut' => 'Statut Invente']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['statut']);
    }
}
