<?php

namespace Database\Seeders;

use App\Modules\TypeEquipement\TypeEquipement;
use Illuminate\Database\Seeder;

class TypeEquipementSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            // Fixe
            'Transformateur' => 'Fixe',
            'Armoire BT' => 'Fixe',
            'Armoire Compensation' => 'Fixe',
            // Mobile (géré par un collègue, mais on renseigne quand même la catégorie
            // pour que le filtre "Équipements fixes" les exclue correctement)
            'Chariot Élévateur' => 'Mobile',
            'Grue Mobile' => 'Mobile',
            'Camion Benne' => 'Mobile',
            'Nacelle Élévatrice' => 'Mobile',
            'Tracteur Routier' => 'Mobile',
        ];

        foreach ($types as $libelle => $categorie) {
            // Si le type existe déjà (créé à la main dans l'appli), on met juste sa
            // catégorie à jour sans toucher à sa périodicité de contrôle existante.
            $type = TypeEquipement::firstOrNew(['libelle' => $libelle]);
            $type->categorie = $categorie;
            if (!$type->exists) {
                $type->periodicite_controle = 12; // valeur par défaut, modifiable ensuite
            }
            $type->save();
        }

        echo "✅ " . count($types) . " type(s) d'équipement mis à jour avec leur catégorie\n";
    }
}
