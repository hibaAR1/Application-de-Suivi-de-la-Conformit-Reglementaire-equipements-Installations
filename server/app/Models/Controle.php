<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Controle extends Model
{
    protected $table = 'controle';
    protected $primaryKey = 'id_controle';
    public $timestamps = false;

    protected $fillable = [
        'id_equipement', 'date_controle', 'organisme_controle',
        'resultat_global', 'rapport_controle', 'prochaine_echeance',
        'id_utilisateur_auteur',
    ];

    public function equipement()
    {
        return $this->belongsTo(Equipement::class, 'id_equipement');
    }

    public function reserves()
    {
        return $this->hasMany(Reserve::class, 'id_controle');
    }
}
