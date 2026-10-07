<?php

namespace App\Models;

use App\Models\Engin;
use Illuminate\Database\Eloquent\Model;

// Rapport de contrôle (PDF) d'un ENGIN (table "rapport_engin", séparée de
// "rapport_controle").
class RapportEngin extends Model
{
    protected $table = 'rapport_engin';
    protected $primaryKey = 'id_rapport_engin';
    public $timestamps = false;

    protected $fillable = [
        'id_engin', 'date_rapport', 'organisme', 'reference',
        'chemin_pdf', 'constatations', 'date_creation',
    ];

    public function engin()
    {
        return $this->belongsTo(Engin::class, 'id_engin');
    }
}
