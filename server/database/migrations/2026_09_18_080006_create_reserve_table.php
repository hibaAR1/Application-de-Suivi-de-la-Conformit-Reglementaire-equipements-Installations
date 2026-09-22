<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reserve', function (Blueprint $table) {
            $table->integer('id_reserve', true, false);
            $table->integer('id_controle');
            $table->text('nature_reserve');
            $table->enum('niveau_criticite', ['Mineure', 'Majeure', 'Bloquante']);
            $table->date('delai_levee')->nullable();
            $table->enum('statut', ['Ouverte', 'En cours', 'Levée', 'En retard'])->default('Ouverte');
            $table->string('justificatif_levee')->nullable();
            $table->date('date_levee_effective')->nullable();

            $table->foreign('id_controle', 'fk_reserve_controle')
                ->references('id_controle')->on('controle')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reserve');
    }
};