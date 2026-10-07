<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * ============================================================================
 * MIGRATION : table "reserve_engin"
 * ============================================================================
 *
 * RÔLE
 *   Crée la table des RÉSERVES des ENGINS. Une réserve est un défaut relevé
 *   pendant un contrôle, qu'il faut corriger avant une date limite.
 *
 * POURQUOI UNE TABLE À PART ?
 *   Elle est séparée de "reserve" (celle des équipements) et reliée à
 *   "controle_engin". Elle reprend directement la structure FINALE de
 *   "reserve" (niveaux Mineure / Majeure / Critique, statut "Clôturée",
 *   responsable, action corrective), sans repasser par toutes les
 *   migrations intermédiaires des équipements.
 *
 * CYCLE DE VIE D'UNE RÉSERVE (colonne "statut")
 *   Ouverte  ->  En cours  ->  Clôturée
 *   À la clôture, on enregistre la date de levée et un justificatif.
 *
 * TABLES LIÉES
 *   - controle_engin : le contrôle qui a fait apparaître la réserve
 * ============================================================================
 */
return new class extends Migration
{
    // ------------------------------------------------------------------
    // CRÉATION de la table (php artisan migrate)
    // ------------------------------------------------------------------
    public function up(): void
    {
        Schema::create('reserve_engin', function (Blueprint $table) {
            // --- Identifiant et lien avec le contrôle d'origine ---
            $table->integer('id_reserve_engin', true, false);
            $table->integer('id_controle_engin');

            // --- Description du défaut ---
            $table->text('nature_reserve');
            $table->enum('niveau_criticite', ['Mineure', 'Majeure', 'Critique']);

            // --- Plan d'action (facultatif) ---
            $table->string('responsable')->nullable();
            $table->text('action_corrective')->nullable();
            $table->date('delai_levee')->nullable();

            // --- Suivi ---
            $table->enum('statut', ['Ouverte', 'En cours', 'Clôturée'])->default('Ouverte');

            // --- Clôture : preuve (fichier) et date réelle de levée ---
            $table->string('justificatif_levee')->nullable();
            $table->date('date_levee_effective')->nullable();

            // Si le contrôle est supprimé, ses réserves le sont aussi.
            $table->foreign('id_controle_engin', 'fk_reserve_engin_controle')
                ->references('id_controle_engin')->on('controle_engin')
                ->onDelete('cascade');
        });
    }

    // ------------------------------------------------------------------
    // ANNULATION (php artisan migrate:rollback) : supprime la table
    // ------------------------------------------------------------------
    public function down(): void
    {
        Schema::dropIfExists('reserve_engin');
    }
};
