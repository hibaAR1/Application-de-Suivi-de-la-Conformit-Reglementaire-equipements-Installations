<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controle', function (Blueprint $table) {
            $table->id('id_controle');
            $table->string('id_equipement');
            $table->foreign('id_equipement')->references('id_equipement')->on('equipement');
            $table->date('date_controle');
            $table->string('organisme_controle');
            $table->enum('resultat_global', ['Favorable', 'Favorable avec réserves', 'Défavorable']);
            $table->string('rapport_controle')->nullable();
            $table->date('prochaine_echeance')->nullable();
            $table->foreignId('id_utilisateur_auteur')->nullable()->constrained('utilisateur', 'id_utilisateur');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controle');
    }
};