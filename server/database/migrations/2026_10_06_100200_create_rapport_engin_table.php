<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * ============================================================================
 * MIGRATION : table "rapport_engin"
 * ============================================================================
 *
 * RÔLE
 *   Crée la table qui garde les RAPPORTS de contrôle (fichiers PDF) des
 *   ENGINS : un rapport = un document remis par l'organisme de contrôle,
 *   avec ses constatations.
 *
 * POURQUOI UNE TABLE À PART ?
 *   Elle est séparée de "rapport_controle" (celle des équipements). Même
 *   structure, mais liée à la table "engin".
 *
 * TABLES LIÉES
 *   - engin : l'engin concerné (clé étrangère id_engin)
 * ============================================================================
 */
return new class extends Migration
{
    // ------------------------------------------------------------------
    // CRÉATION de la table (php artisan migrate)
    // ------------------------------------------------------------------
    public function up(): void
    {
        Schema::create('rapport_engin', function (Blueprint $table) {
            // --- Identifiant et engin concerné ---
            $table->integer('id_rapport_engin', true, false);
            $table->string('id_engin', 50);

            // --- Contenu du rapport ---
            $table->date('date_rapport');
            $table->string('organisme', 150);
            $table->string('reference', 100)->nullable();
            $table->string('chemin_pdf')->nullable();
            $table->text('constatations')->nullable();

            // Date d'enregistrement dans l'application (remplie toute seule).
            $table->dateTime('date_creation')->useCurrent();

            // Si l'engin est supprimé, ses rapports le sont aussi.
            $table->foreign('id_engin', 'fk_rapport_engin_engin')
                ->references('id_engin')->on('engin')
                ->onDelete('cascade');
        });
    }

    // ------------------------------------------------------------------
    // ANNULATION (php artisan migrate:rollback) : supprime la table
    // ------------------------------------------------------------------
    public function down(): void
    {
        Schema::dropIfExists('rapport_engin');
    }
};
