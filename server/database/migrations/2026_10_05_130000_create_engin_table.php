<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Nouvelle table INDÉPENDANTE de "equipement" (demande du sup) pour les
// engins mobiles. Même structure que "equipement" (mêmes colonnes), mais
// aucune clé étrangère ne pointe vers la table equipement, et rien dans
// equipement ne pointe vers engin : ce sont deux tables séparées qui
// partagent seulement les tables de référence communes (filiale, site,
// type_equipement). Pas de contrôles/réserves pour les engins pour
// l'instant (juste liste/création/modification/suppression) — voir
// EnginController.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('engin', function (Blueprint $table) {
            $table->string('id_engin', 50)->primary();
            $table->string('referentiel', 100)->unique();

            $table->integer('id_filiale');
            $table->foreign('id_filiale', 'fk_engin_filiale')
                ->references('id_filiale')->on('filiale')
                ->onUpdate('cascade');

            $table->unsignedBigInteger('id_site')->nullable();
            $table->foreign('id_site', 'fk_engin_site')
                ->references('id_site')->on('site')
                ->onDelete('set null');

            $table->integer('id_type_equipement');
            $table->foreign('id_type_equipement', 'fk_engin_type')
                ->references('id_type_equipement')->on('type_equipement');

            $table->string('designation', 100);
            $table->string('marque_modele', 150)->nullable();
            $table->string('numero_serie', 100)->unique();
            $table->date('date_mise_en_service');
            $table->integer('periodicite_mois')->nullable();
            $table->string('statut')->default('Conforme');
            $table->string('qr_code')->nullable();
            $table->string('immatriculation', 50)->nullable();
            $table->string('fabricant', 100)->nullable();
            $table->string('modele', 100)->nullable();
            $table->integer('annee_fabrication')->nullable();
            $table->string('organisme_controle', 150)->nullable();
            $table->text('caracteristiques')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('engin');
    }
};
