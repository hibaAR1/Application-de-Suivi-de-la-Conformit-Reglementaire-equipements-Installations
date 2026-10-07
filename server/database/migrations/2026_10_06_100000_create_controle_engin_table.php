<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Contrôles des ENGINS : table séparée de "controle" (celle des équipements),
// même structure mais liée à la table "engin". Les contrôles des équipements
// ne sont pas touchés.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controle_engin', function (Blueprint $table) {
            $table->integer('id_controle_engin', true, false);
            $table->string('id_engin', 50);
            $table->date('date_controle');
            $table->string('organisme_controle', 150);
            $table->enum('resultat_global', ['Favorable', 'Favorable avec réserves', 'Défavorable']);
            $table->string('rapport_controle')->nullable();
            $table->date('prochaine_echeance');
            $table->integer('id_utilisateur_auteur')->nullable();

            // Pas de cascade (comme pour les équipements) : on ne perd jamais
            // l'historique des contrôles par accident, la suppression d'un engin
            // supprime ses contrôles explicitement dans le contrôleur.
            $table->foreign('id_engin', 'fk_controle_engin_engin')
                ->references('id_engin')->on('engin');

            $table->foreign('id_utilisateur_auteur', 'fk_controle_engin_utilisateur')
                ->references('id_utilisateur')->on('utilisateur')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controle_engin');
    }
};
