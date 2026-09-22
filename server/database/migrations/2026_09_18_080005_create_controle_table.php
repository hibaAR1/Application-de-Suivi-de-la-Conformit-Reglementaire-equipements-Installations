<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controle', function (Blueprint $table) {
            $table->integer('id_controle', true, false);
            $table->string('id_equipement', 50);
            $table->date('date_controle');
            $table->string('organisme_controle', 150);
            $table->enum('resultat_global', ['Favorable', 'Favorable avec réserves', 'Défavorable']);
            $table->string('rapport_controle')->nullable();
            $table->date('prochaine_echeance');
            $table->integer('id_utilisateur_auteur')->nullable();

            $table->foreign('id_equipement', 'fk_controle_equipement')
                ->references('id_equipement')->on('equipement');

            $table->foreign('id_utilisateur_auteur', 'fk_controle_utilisateur')
                ->references('id_utilisateur')->on('utilisateur')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controle');
    }
};