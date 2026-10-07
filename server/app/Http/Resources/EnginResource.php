<?php

namespace App\Http\Resources;

use App\Http\Resources\ControleEnginResource;
use App\Http\Resources\FilialeResource;
use App\Http\Resources\RapportEnginResource;
use App\Http\Resources\SiteResource;
use App\Http\Resources\TypeEquipementResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/*
 * ============================================================================
 * RESSOURCE API : EnginResource
 * ============================================================================
 *
 * RÔLE
 *   Définit le JSON renvoyé au frontend pour UN engin : quelles colonnes du
 *   modèle Engin sont exposées, et les relations incluses.
 *
 * RELATIONS INCLUSES (seulement si chargées par le contrôleur : whenLoaded)
 *   - filiale, site, type_equipement : informations de rattachement
 *   - controles : contrôles de l'engin, avec leurs réserves
 *   - rapports  : rapports PDF de l'engin
 *
 * ATTENTION
 *   Une relation qui n'est pas listée ici n'arrive jamais au frontend, même
 *   si le contrôleur la charge. Par exemple, sans la ligne "controles", les
 *   réserves de l'engin seraient invisibles dans l'application.
 * ============================================================================
 */
class EnginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // --- Identifiants ---
            'id_engin' => $this->id_engin,
            'referentiel' => $this->referentiel,

            // --- Rattachement ---
            'id_filiale' => $this->id_filiale,
            'id_site' => $this->id_site,
            'id_type_equipement' => $this->id_type_equipement,

            // --- Informations générales ---
            'designation' => $this->designation,
            'marque_modele' => $this->marque_modele,
            'numero_serie' => $this->numero_serie,
            'date_mise_en_service' => $this->date_mise_en_service,
            'periodicite_mois' => $this->periodicite_mois,
            'statut' => $this->statut,
            'qr_code' => $this->qr_code,

            // --- Détails techniques ---
            'immatriculation' => $this->immatriculation,
            'fabricant' => $this->fabricant,
            'modele' => $this->modele,
            'annee_fabrication' => $this->annee_fabrication,
            'organisme_controle' => $this->organisme_controle,
            'caracteristiques' => $this->caracteristiques,

            // --- Relations ---
            'filiale' => FilialeResource::make($this->whenLoaded('filiale')),
            'site' => SiteResource::make($this->whenLoaded('site')),
            'type_equipement' => TypeEquipementResource::make($this->whenLoaded('typeEquipement')),
            'controles' => ControleEnginResource::collection($this->whenLoaded('controles')),
            'rapports' => RapportEnginResource::collection($this->whenLoaded('rapports')),
        ];
    }
}
