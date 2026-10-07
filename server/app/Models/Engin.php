<?php

namespace App\Models;

use App\Models\ControleEngin;
use App\Models\Filiale;
use App\Models\RapportEngin;
use App\Models\Site;
use App\Models\TypeEquipement;
use Illuminate\Database\Eloquent\Model;

class Engin extends Model
{
    protected $table = 'engin';
    protected $primaryKey = 'id_engin';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_engin', 'referentiel', 'id_filiale', 'id_site', 'id_type_equipement',
        'designation', 'marque_modele', 'numero_serie',
        'date_mise_en_service', 'periodicite_mois', 'statut', 'qr_code',
        'immatriculation', 'fabricant', 'modele', 'annee_fabrication',
        'organisme_controle', 'caracteristiques',
    ];

    protected $casts = [
        'caracteristiques' => 'array',
    ];

    public function filiale() { return $this->belongsTo(Filiale::class, 'id_filiale'); }
    public function site() { return $this->belongsTo(Site::class, 'id_site'); }
    public function typeEquipement() { return $this->belongsTo(TypeEquipement::class, 'id_type_equipement'); }

    // Contrôles et rapports de CET engin (tables "controle_engin" et
    // "rapport_engin", séparées de celles des équipements).
    public function controles() { return $this->hasMany(ControleEngin::class, 'id_engin'); }
    public function rapports() { return $this->hasMany(RapportEngin::class, 'id_engin'); }
}
