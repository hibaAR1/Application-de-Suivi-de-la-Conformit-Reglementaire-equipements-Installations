<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rapport extends Model
{
    protected $table = 'rapport_controle';
    protected $primaryKey = 'id_rapport';
    public $timestamps = false;

    protected $fillable = [
        'id_equipement', 'date_rapport', 'organisme', 'reference',
        'chemin_pdf', 'constatations', 'date_creation',
    ];

    public function equipement()
    {
        return $this->belongsTo(Equipement::class, 'id_equipement');
    }
}
