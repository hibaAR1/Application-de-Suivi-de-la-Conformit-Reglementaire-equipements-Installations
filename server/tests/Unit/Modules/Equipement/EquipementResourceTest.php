<?php

namespace Tests\Unit\Modules\Equipement;

use App\Modules\Equipement\Equipement;
use App\Modules\Equipement\Resources\EquipementResource;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

// Test unitaire pur de la classe Resource : vérifie que le tableau produit
// contient exactement les champs attendus par le frontend, sans avoir besoin
// d'une base de données (le modèle n'est jamais enregistré).
class EquipementResourceTest extends TestCase
{
    public function test_toarray_contient_les_champs_bruts_de_lequipement(): void
    {
        $equipement = new Equipement([
            'id_equipement' => 'CTM-201-CHAR-01',
            'referentiel' => 'CTM-201-CHAR-01',
            'id_filiale' => 1,
            'id_site' => 1,
            'id_type_equipement' => 1,
            'designation' => 'Chariot élévateur',
            'numero_serie' => 'SN-001',
            'date_mise_en_service' => '2026-01-01',
            'periodicite_mois' => 12,
            'statut' => 'Conforme',
            'caracteristiques' => ['poids' => '500kg'],
        ]);

        $tableau = (new EquipementResource($equipement))->toArray(Request::create('/'));

        $this->assertSame('CTM-201-CHAR-01', $tableau['id_equipement']);
        $this->assertSame('Chariot élévateur', $tableau['designation']);
        $this->assertSame('Conforme', $tableau['statut']);
        $this->assertSame(['poids' => '500kg'], $tableau['caracteristiques']);

        // Les relations non chargées (filiale, site, type_equipement, controles,
        // rapports) sont bien présentes dans le tableau des clés — c'est le
        // passage par jsonSerialize()/resolve() (testé côté Feature, avec une
        // vraie requête HTTP) qui les retire proprement de la réponse finale.
        foreach (['filiale', 'site', 'type_equipement', 'controles', 'rapports'] as $cle) {
            $this->assertArrayHasKey($cle, $tableau);
        }
    }
}
