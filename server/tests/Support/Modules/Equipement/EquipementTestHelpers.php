<?php

namespace Tests\Support\Modules\Equipement;

use App\Modules\Filiale\Filiale;
use App\Modules\Site\Site;
use App\Modules\TypeEquipement\TypeEquipement;
use App\Modules\Utilisateur\Utilisateur;
use Database\Seeders\DatabaseSeeder;

// Préparation commune aux tests fonctionnels et sécurité d'Equipement
// (tests/Feature/Modules/Equipement et tests/Security/Modules/Equipement) :
// données de départ (filiale, site, type, utilisateur), payload valide, et
// connexion via le vrai flux de login (POST /api/login) plutôt qu'un faux
// utilisateur injecté dans le guard.
trait EquipementTestHelpers
{
    private Filiale $filiale;
    private Site $site;
    private TypeEquipement $type;
    private Utilisateur $utilisateur;

    protected function preparerEquipementDeTest(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->filiale = Filiale::where('code', 'CTM')->firstOrFail();
        $this->site = Site::where('id_filiale', $this->filiale->id_filiale)->where('code', '201')->firstOrFail();
        $this->type = TypeEquipement::where('libelle', 'Chariot Élévateur')->firstOrFail();
        $this->utilisateur = Utilisateur::where('email', 'admin@menara-holding.ma')->firstOrFail();
    }

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
}
