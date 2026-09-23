<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipement', function (Blueprint $table) {
            $table->string('immatriculation', 50)->nullable();
            $table->string('fabricant', 100)->nullable();
            $table->string('modele', 100)->nullable();
            $table->integer('annee_fabrication')->nullable();
            $table->string('organisme_controle', 150)->nullable();
            $table->text('caracteristiques')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('equipement', function (Blueprint $table) {
            $table->dropColumn([
                'immatriculation',
                'fabricant',
                'modele',
                'annee_fabrication',
                'organisme_controle',
                'caracteristiques',
            ]);
        });
    }
};
