<?php

namespace App\Models;

use App\Models\Engin;
use App\Models\ReserveEngin;
use Illuminate\Database\Eloquent\Model;

/*
 * ============================================================================
 * MODÈLE : ControleEngin  (table "controle_engin")
 * ============================================================================
 *
 * RÔLE
 *   Représente UN contrôle réglementaire fait sur un engin (date, organisme,
 *   résultat, prochaine échéance). Équivalent du modèle Controle des
 *   équipements, mais dans une table séparée.
 *
 * LIENS AVEC LES AUTRES MODÈLES
 *   - engin()    : l'engin qui a été contrôlé
 *   - reserves() : les réserves (défauts) relevées pendant ce contrôle
 * ============================================================================
 */
class ControleEngin extends Model
{
    // ------------------------------------------------------------------
    // Configuration de la table
    // ------------------------------------------------------------------
    protected $table = 'controle_engin';
    protected $primaryKey = 'id_controle_engin';

    // La table n'a pas de colonnes created_at / updated_at.
    public $timestamps = false;

    // ------------------------------------------------------------------
    // Colonnes qu'on a le droit de remplir en une seule fois
    // ------------------------------------------------------------------
    protected $fillable = [
        'id_engin', 'date_controle', 'organisme_controle',
        'resultat_global', 'rapport_controle', 'prochaine_echeance',
        'id_utilisateur_auteur',
    ];

    // ------------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------------
    public function engin()
    {
        return $this->belongsTo(Engin::class, 'id_engin');
    }

    public function reserves()
    {
        return $this->hasMany(ReserveEngin::class, 'id_controle_engin');
    }
}
