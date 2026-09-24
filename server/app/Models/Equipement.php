<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipement extends Model
{
    protected $table = 'equipement';
    protected $primaryKey = 'id_equipement';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id_equipement', 'referentiel', 'id_filiale', 'id_site', 'id_type_equipement',
        'designation', 'marque_modele', 'numero_serie',
        'date_mise_en_service', 'periodicite_mois', 'statut', 'qr_code',
        'immatriculation', 'fabricant', 'modele', 'annee_fabrication',
        'organisme_controle', 'caracteristiques',
    ];

    protected $casts = [
        'caracteristiques' => 'array',
    ];

    public function controles()
    {
        return $this->hasMany(Controle::class, 'id_equipement');
    }

    public function filiale()
    {
        return $this->belongsTo(Filiale::class, 'id_filiale');
    }

    public function site()
    {
        return $this->belongsTo(Site::class, 'id_site');
    }

    public function typeEquipement()
    {
        return $this->belongsTo(TypeEquipement::class, 'id_type_equipement');
    }

    public function rapports()
    {
        return $this->hasMany(Rapport::class, 'id_equipement');
    }
}
