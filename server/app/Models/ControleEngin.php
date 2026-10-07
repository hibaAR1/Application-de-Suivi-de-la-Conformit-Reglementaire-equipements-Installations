<?php

namespace App\Models;

use App\Models\Engin;
use App\Models\ReserveEngin;
use Illuminate\Database\Eloquent\Model;

// Contrôle d'un ENGIN (table "controle_engin", séparée de "controle").
class ControleEngin extends Model
{
    protected $table = 'controle_engin';
    protected $primaryKey = 'id_controle_engin';
    public $timestamps = false;

    protected $fillable = [
        'id_engin', 'date_controle', 'organisme_controle',
        'resultat_global', 'rapport_controle', 'prochaine_echeance',
        'id_utilisateur_auteur',
    ];

    public function engin()
    {
        return $this->belongsTo(Engin::class, 'id_engin');
    }

    public function reserves()
    {
        return $this->hasMany(ReserveEngin::class, 'id_controle_engin');
    }
}
