<?php

namespace App\Models;

use App\Models\Engin;
use Illuminate\Database\Eloquent\Model;

/*
 * ============================================================================
 * MODÈLE : RapportEngin  (table "rapport_engin")
 * ============================================================================
 *
 * RÔLE
 *   Représente UN rapport de contrôle (fichier PDF) d'un engin. Équivalent
 *   du modèle RapportControle des équipements, mais dans une table séparée.
 *
 * LIENS AVEC LES AUTRES MODÈLES
 *   - engin() : l'engin concerné par le rapport
 * ============================================================================
 */
class RapportEngin extends Model
{
    // ------------------------------------------------------------------
    // Configuration de la table
    // ------------------------------------------------------------------
    protected $table = 'rapport_engin';
    protected $primaryKey = 'id_rapport_engin';

    // La table n'a pas de colonnes created_at / updated_at
    // (elle a sa propre colonne "date_creation").
    public $timestamps = false;

    // ------------------------------------------------------------------
    // Colonnes qu'on a le droit de remplir en une seule fois
    // ------------------------------------------------------------------
    protected $fillable = [
        'id_engin', 'date_rapport', 'organisme', 'reference',
        'chemin_pdf', 'constatations', 'date_creation',
    ];

    // ------------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------------
    public function engin()
    {
        return $this->belongsTo(Engin::class, 'id_engin');
    }
}
