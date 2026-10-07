<?php

namespace App\Models;

use App\Models\ControleEngin;
use Illuminate\Database\Eloquent\Model;

// Réserve d'un contrôle d'ENGIN (table "reserve_engin", séparée de "reserve").
class ReserveEngin extends Model
{
    protected $table = 'reserve_engin';
    protected $primaryKey = 'id_reserve_engin';
    public $timestamps = false;

    protected $fillable = [
        'id_controle_engin', 'nature_reserve', 'niveau_criticite', 'responsable',
        'action_corrective', 'delai_levee', 'statut', 'justificatif_levee',
        'date_levee_effective',
    ];

    public function controle()
    {
        return $this->belongsTo(ControleEngin::class, 'id_controle_engin');
    }

    // Même règle de délai que pour les équipements (voir Reserve::DELAIS_JOURS) :
    // on la réutilise directement pour garder une seule source de vérité.
    public static function calculerDelai(string $criticite, string $dateControle): string
    {
        return Reserve::calculerDelai($criticite, $dateControle);
    }
}
