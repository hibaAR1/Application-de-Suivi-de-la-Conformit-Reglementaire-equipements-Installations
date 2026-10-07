<?php

namespace App\Models;

use App\Models\ControleEngin;
use Illuminate\Database\Eloquent\Model;

/*
 * ============================================================================
 * MODÈLE : ReserveEngin  (table "reserve_engin")
 * ============================================================================
 *
 * RÔLE
 *   Représente UNE réserve (défaut à corriger) relevée pendant le contrôle
 *   d'un engin. Équivalent du modèle Reserve des équipements, mais dans une
 *   table séparée.
 *
 * STATUTS POSSIBLES : Ouverte -> En cours -> Clôturée
 *
 * LIENS AVEC LES AUTRES MODÈLES
 *   - controle() : le contrôle (ControleEngin) qui a fait apparaître la réserve
 * ============================================================================
 */
class ReserveEngin extends Model
{
    // ------------------------------------------------------------------
    // Configuration de la table
    // ------------------------------------------------------------------
    protected $table = 'reserve_engin';
    protected $primaryKey = 'id_reserve_engin';

    // La table n'a pas de colonnes created_at / updated_at.
    public $timestamps = false;

    // ------------------------------------------------------------------
    // Colonnes qu'on a le droit de remplir en une seule fois
    // ------------------------------------------------------------------
    protected $fillable = [
        // Lien et description
        'id_controle_engin', 'nature_reserve', 'niveau_criticite',
        // Plan d'action
        'responsable', 'action_corrective', 'delai_levee',
        // Suivi et clôture
        'statut', 'justificatif_levee', 'date_levee_effective',
    ];

    // ------------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------------
    public function controle()
    {
        return $this->belongsTo(ControleEngin::class, 'id_controle_engin');
    }

    // ------------------------------------------------------------------
    // Calcul du délai de levée
    // ------------------------------------------------------------------
    // Même règle de délai que pour les équipements (voir Reserve::DELAIS_JOURS) :
    // on la réutilise directement pour garder une seule source de vérité.
    public static function calculerDelai(string $criticite, string $dateControle): string
    {
        return Reserve::calculerDelai($criticite, $dateControle);
    }
}
