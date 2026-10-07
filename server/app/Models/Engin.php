<?php

namespace App\Models;

use App\Models\ControleEngin;
use App\Models\Filiale;
use App\Models\RapportEngin;
use App\Models\Site;
use App\Models\TypeEquipement;
use Illuminate\Database\Eloquent\Model;

/*
 * ============================================================================
 * MODÈLE : Engin  (table "engin")
 * ============================================================================
 *
 * RÔLE
 *   Représente UN engin (matériel mobile : grue, camion, nacelle...).
 *   C'est l'équivalent du modèle Equipement, mais pour les engins, dans une
 *   table indépendante de celle des équipements.
 *
 * LIENS AVEC LES AUTRES MODÈLES
 *   - filiale()        : la filiale propriétaire
 *   - site()           : le site où se trouve l'engin
 *   - typeEquipement() : son type (Grue Mobile, Camion Benne...)
 *   - controles()      : ses contrôles réglementaires (ControleEngin)
 *   - rapports()       : ses rapports PDF (RapportEngin)
 * ============================================================================
 */
class Engin extends Model
{
    // ------------------------------------------------------------------
    // Configuration de la table
    // ------------------------------------------------------------------
    protected $table = 'engin';

    // La clé est un TEXTE (ex. "MT-201-GRUE-01"), pas un numéro automatique.
    protected $primaryKey = 'id_engin';
    public $incrementing = false;
    protected $keyType = 'string';

    // ------------------------------------------------------------------
    // Colonnes qu'on a le droit de remplir en une seule fois
    // ------------------------------------------------------------------
    protected $fillable = [
        // Identifiants
        'id_engin', 'referentiel',
        // Rattachement
        'id_filiale', 'id_site', 'id_type_equipement',
        // Informations générales
        'designation', 'marque_modele', 'numero_serie',
        'date_mise_en_service', 'periodicite_mois', 'statut', 'qr_code',
        // Détails techniques
        'immatriculation', 'fabricant', 'modele', 'annee_fabrication',
        'organisme_controle', 'caracteristiques',
    ];

    // La colonne "caracteristiques" est enregistrée en JSON dans la base,
    // mais on la manipule comme un tableau dans le code.
    protected $casts = [
        'caracteristiques' => 'array',
    ];

    // ------------------------------------------------------------------
    // Relations : réfèrent à d'autres tables
    // ------------------------------------------------------------------
    public function filiale() { return $this->belongsTo(Filiale::class, 'id_filiale'); }
    public function site() { return $this->belongsTo(Site::class, 'id_site'); }
    public function typeEquipement() { return $this->belongsTo(TypeEquipement::class, 'id_type_equipement'); }

    // Contrôles et rapports de CET engin (tables "controle_engin" et
    // "rapport_engin", séparées de celles des équipements).
    public function controles() { return $this->hasMany(ControleEngin::class, 'id_engin'); }
    public function rapports() { return $this->hasMany(RapportEngin::class, 'id_engin'); }
}
