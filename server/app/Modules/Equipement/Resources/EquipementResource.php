<?php

namespace App\Modules\Equipement\Resources;

use App\Modules\Controle\Resources\ControleResource;
use App\Modules\Filiale\Resources\FilialeResource;
use App\Modules\Rapport\Resources\RapportResource;
use App\Modules\Site\Resources\SiteResource;
use App\Modules\TypeEquipement\Resources\TypeEquipementResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_equipement' => $this->id_equipement,
            'referentiel' => $this->referentiel,
            'id_filiale' => $this->id_filiale,
            'id_site' => $this->id_site,
            'id_type_equipement' => $this->id_type_equipement,
            'designation' => $this->designation,
            'marque_modele' => $this->marque_modele,
            'numero_serie' => $this->numero_serie,
            'date_mise_en_service' => $this->date_mise_en_service,
            'periodicite_mois' => $this->periodicite_mois,
            'statut' => $this->statut,
            'qr_code' => $this->qr_code,
            'immatriculation' => $this->immatriculation,
            'fabricant' => $this->fabricant,
            'modele' => $this->modele,
            'annee_fabrication' => $this->annee_fabrication,
            'organisme_controle' => $this->organisme_controle,
            'caracteristiques' => $this->caracteristiques,
            'filiale' => FilialeResource::make($this->whenLoaded('filiale')),
            'site' => SiteResource::make($this->whenLoaded('site')),
            'typeEquipement' => TypeEquipementResource::make($this->whenLoaded('typeEquipement')),
            'controles' => ControleResource::collection($this->whenLoaded('controles')),
            'rapports' => RapportResource::collection($this->whenLoaded('rapports')),
        ];
    }
}
