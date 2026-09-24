<?php

namespace Tests\Unit\Modules\Equipement;

use App\Modules\Equipement\Equipement;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tests\TestCase;

// Tests unitaires du modèle Equipement lui-même (casts, relations, clé
// primaire) : aucune requête n'est exécutée (pas de RefreshDatabase), mais
// on a besoin que le framework soit démarré (Tests\TestCase) pour que
// construire un objet de relation (->filiale(), ->controles()...) trouve un
// connecteur de base de données, même sans jamais l'interroger.
class EquipementModelTest extends TestCase
{
    public function test_caracteristiques_est_bien_castee_en_tableau(): void
    {
        $equipement = new Equipement();
        $equipement->caracteristiques = ['poids' => '500kg', 'hauteur' => '2m'];

        $this->assertIsArray($equipement->caracteristiques);
        $this->assertSame('500kg', $equipement->caracteristiques['poids']);
    }

    public function test_la_cle_primaire_est_id_equipement_et_nest_pas_auto_incrementee(): void
    {
        $equipement = new Equipement();

        $this->assertSame('id_equipement', $equipement->getKeyName());
        $this->assertFalse($equipement->incrementing);
        $this->assertSame('string', $equipement->getKeyType());
    }

    public function test_les_champs_assignables_en_masse_sont_ceux_attendus(): void
    {
        $attendus = [
            'id_equipement', 'referentiel', 'id_filiale', 'id_site', 'id_type_equipement',
            'designation', 'marque_modele', 'numero_serie',
            'date_mise_en_service', 'periodicite_mois', 'statut', 'qr_code',
            'immatriculation', 'fabricant', 'modele', 'annee_fabrication',
            'organisme_controle', 'caracteristiques',
        ];

        $this->assertSame($attendus, (new Equipement())->getFillable());
    }

    public function test_les_relations_sont_du_bon_type(): void
    {
        $equipement = new Equipement();

        $this->assertInstanceOf(HasMany::class, $equipement->controles());
        $this->assertInstanceOf(HasMany::class, $equipement->rapports());
        $this->assertInstanceOf(BelongsTo::class, $equipement->filiale());
        $this->assertInstanceOf(BelongsTo::class, $equipement->site());
        $this->assertInstanceOf(BelongsTo::class, $equipement->typeEquipement());
    }
}
