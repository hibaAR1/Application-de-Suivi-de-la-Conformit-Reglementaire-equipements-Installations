<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Rapports de contrôle (PDF) des ENGINS : table séparée de "rapport_controle"
// (celle des équipements), même structure mais liée à la table "engin".
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rapport_engin', function (Blueprint $table) {
            $table->integer('id_rapport_engin', true, false);
            $table->string('id_engin', 50);
            $table->date('date_rapport');
            $table->string('organisme', 150);
            $table->string('reference', 100)->nullable();
            $table->string('chemin_pdf')->nullable();
            $table->text('constatations')->nullable();
            $table->dateTime('date_creation')->useCurrent();

            $table->foreign('id_engin', 'fk_rapport_engin_engin')
                ->references('id_engin')->on('engin')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapport_engin');
    }
};
