<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * ============================================================================
 * MIGRATION : table "engin"
 * ============================================================================
 *
 * RÔLE
 *   Crée la table qui contient la liste des ENGINS (matériel mobile :
 *   grues, camions, nacelles...). Une ligne = un engin.
 *
 * POURQUOI UNE TABLE À PART ?
 *   Les engins sont gérés indépendamment des équipements fixes : on peut
 *   les ajouter, les modifier ou les supprimer sans jamais toucher aux
 *   données des équipements. La table "engin" a les mêmes colonnes que
 *   "equipement", mais :
 *     - aucune clé étrangère ne pointe vers la table "equipement" ;
 *     - rien dans "equipement" ne pointe vers "engin".
 *   Les deux tables partagent seulement les tables de référence communes :
 *   filiale, site et type_equipement.
 *
 * TABLES LIÉES (créées dans les migrations suivantes)
 *   - controle_engin : les contrôles de chaque engin
 *   - reserve_engin  : les réserves issues de ces contrôles
 *   - rapport_engin  : les rapports PDF de chaque engin
 *
 * OÙ EST LA LOGIQUE ?
 *   Voir EnginController (création, modification, suppression).
 * ============================================================================
 */
return new class extends Migration
{
    // ------------------------------------------------------------------
    // CRÉATION de la table (php artisan migrate)
    // ------------------------------------------------------------------
    public function up(): void
    {
        Schema::create('engin', function (Blueprint $table) {
            // --- Identifiants (générés par le serveur, ex. "MT-201-GRUE-01") ---
            $table->string('id_engin', 50)->primary();
            $table->string('referentiel', 100)->unique();

            // --- Rattachement : filiale, site, type d'équipement ---
            $table->integer('id_filiale');
            $table->foreign('id_filiale', 'fk_engin_filiale')
                ->references('id_filiale')->on('filiale')
                ->onUpdate('cascade');

            // Si le site est supprimé, l'engin reste (le site passe à NULL).
            $table->unsignedBigInteger('id_site')->nullable();
            $table->foreign('id_site', 'fk_engin_site')
                ->references('id_site')->on('site')
                ->onDelete('set null');

            $table->integer('id_type_equipement');
            $table->foreign('id_type_equipement', 'fk_engin_type')
                ->references('id_type_equipement')->on('type_equipement');

            // --- Informations générales ---
            $table->string('designation', 100);
            $table->string('marque_modele', 150)->nullable();
            $table->string('numero_serie', 100)->unique();
            $table->date('date_mise_en_service');
            $table->integer('periodicite_mois')->nullable();
            $table->string('statut')->default('Conforme');
            $table->string('qr_code')->nullable();

            // --- Détails techniques (onglet "Informations" de la fiche) ---
            $table->string('immatriculation', 50)->nullable();
            $table->string('fabricant', 100)->nullable();
            $table->string('modele', 100)->nullable();
            $table->integer('annee_fabrication')->nullable();
            $table->string('organisme_controle', 150)->nullable();

            // Caractéristiques propres au type (stockées en JSON, voir le
            // modèle Engin : conversion automatique en tableau).
            $table->text('caracteristiques')->nullable();

            $table->timestamps();
        });
    }

    // ------------------------------------------------------------------
    // ANNULATION (php artisan migrate:rollback) : supprime la table
    // ------------------------------------------------------------------
    public function down(): void
    {
        Schema::dropIfExists('engin');
    }
};
