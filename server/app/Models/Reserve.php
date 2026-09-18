<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reserve extends Model
{
    protected $table = 'reserve';
    protected $primaryKey = 'id_reserve';
    public $timestamps = false;

    protected $fillable = [
        'id_controle', 'nature_reserve', 'niveau_criticite',
        'delai_levee', 'statut', 'justificatif_levee', 'date_levee_effective',
    ];

    public function controle()
    {
        return $this->belongsTo(Controle::class, 'id_controle');
    }
}
