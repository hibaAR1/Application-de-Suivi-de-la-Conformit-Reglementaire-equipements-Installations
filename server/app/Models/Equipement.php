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
        'id_equipement', 'referentiel', 'id_filiale', 'id_type_equipement',
        'designation', 'marque_modele', 'numero_serie',
        'date_mise_en_service', 'statut', 'qr_code',
    ];

    public function controles()
    {
        return $this->hasMany(Controle::class, 'id_equipement');
    }
    // app/Models/Equipement.php — ajoute ces 2 méthodes dans la classe

public function filiale()
{
    return $this->belongsTo(Filiale::class, 'id_filiale');
}

public function typeEquipement()
{
    return $this->belongsTo(TypeEquipement::class, 'id_type_equipement');
}
}
