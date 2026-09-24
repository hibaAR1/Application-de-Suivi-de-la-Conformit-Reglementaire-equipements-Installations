<?php

namespace App\Modules\TypeEquipement;

use Illuminate\Database\Eloquent\Model;

class TypeEquipement extends Model
{
    protected $table = 'type_equipement';
    protected $primaryKey = 'id_type_equipement';
    public $timestamps = false;
    protected $fillable = [
        'libelle', 'categorie', 'periodicite_controle', 'caracteristiques_definition',
    ];

    protected $casts = [
        'caracteristiques_definition' => 'array',
    ];
}
