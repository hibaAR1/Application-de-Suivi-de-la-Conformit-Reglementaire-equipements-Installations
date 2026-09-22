<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reserve', function (Blueprint $table) {
            $table->id('id_reserve');
            $table->foreignId('id_controle')->constrained('controle', 'id_controle');
            $table->text('nature_reserve');
            $table->enum('niveau_criticite', ['Mineure', 'Majeure', 'Bloquante']);
            $table->date('delai_levee')->nullable();
            $table->enum('statut', ['Ouverte', 'En cours', 'Levée', 'En retard'])->default('Ouverte');
            $table->string('justificatif_levee')->nullable();
            $table->date('date_levee_effective')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reserve');
    }
};