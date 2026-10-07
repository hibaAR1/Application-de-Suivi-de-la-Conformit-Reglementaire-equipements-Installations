<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * ============================================================================
 * MIGRATION : table "controle_engin"
 * ============================================================================
 *
 * RÔLE
 *   Crée la table qui garde l'historique des CONTRÔLES réglementaires des
 *   ENGINS (une ligne = un contrôle fait sur un engin à une date donnée).
 *
 * POURQUOI UNE TABLE À PART ?
 *   Les engins ont leurs propres tables, séparées de celles des équipements
 *   fixes. Cette table a la même structure que "controle" (celle des
 *   équipements), mais elle est reliée à la table "engin".
 *   Les contrôles des équipements ne sont jamais touchés.
 *
 * TABLES LIÉES
 *   - engin       : l'engin contrôlé (clé étrangère id_engin)
 *   - utilisateur : la personne qui a saisi le contrôle
 *   - reserve_engin (créée dans la migration suivante) : les réserves
 *     issues de ce contrôle pointent vers cette table.
 * ============================================================================
 */
return new class extends Migration
{
    // ------------------------------------------------------------------
    // CRÉATION de la table (php artisan migrate)
    // ------------------------------------------------------------------
    public function up(): void
    {
        Schema::create('controle_engin', function (Blueprint $table) {
            // --- Identifiant (numéro automatique : 1, 2, 3...) ---
            $table->integer('id_controle_engin', true, false);

            // --- Quel engin a été contrôlé ? (ex. "MT-201-GRUE-01") ---
            $table->string('id_engin', 50);

            // --- Informations du contrôle ---
            $table->date('date_controle');
            $table->string('organisme_controle', 150);
            $table->enum('resultat_global', [
                'Favorable',
                'Favorable avec réserves',
                'Défavorable'
            ]);

            // --- Rapport PDF (chemin du fichier, facultatif) ---
            $table->string('rapport_controle')->nullable();

            // --- Prochaine date de contrôle (calculée par le serveur :
            //     date du contrôle + périodicité de l'engin) ---
            $table->date('prochaine_echeance');

            // --- Qui a saisi ce contrôle (facultatif) ---
            $table->integer('id_utilisateur_auteur')->nullable();

            // --- Liens avec les autres tables ---
            // Pas de suppression en cascade (comme pour les équipements) :
            // on ne perd jamais l'historique des contrôles par accident.
            // La suppression d'un engin supprime ses contrôles explicitement,
            // dans le contrôleur (EnginController).
            $table->foreign('id_engin', 'fk_controle_engin_engin')
                ->references('id_engin')->on('engin');

            // Si l'utilisateur est supprimé, le contrôle reste, mais sans
            // auteur (la colonne passe à NULL).
            $table->foreign('id_utilisateur_auteur', 'fk_controle_engin_utilisateur')
                ->references('id_utilisateur')->on('utilisateur')
                ->onDelete('set null');
        });
    }

    // ------------------------------------------------------------------
    // ANNULATION (php artisan migrate:rollback) : supprime la table
    // ------------------------------------------------------------------
    public function down(): void
    {
        Schema::dropIfExists('controle_engin');
    }
};
