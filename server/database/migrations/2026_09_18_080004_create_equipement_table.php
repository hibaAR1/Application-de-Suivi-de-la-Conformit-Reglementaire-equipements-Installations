<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipement', function (Blueprint $table) {
            $table->string('id_equipement', 50)->primary();
            $table->string('referentiel', 100)->unique();
            $table->integer('id_filiale');
            $table->integer('id_type_equipement');
            $table->string('designation', 100);
            $table->string('marque_modele', 150)->nullable();
            $table->string('numero_serie', 100)->unique();
            $table->date('date_mise_en_service');
            $table->enum('statut', ['En service', 'Hors service', 'En réserve', 'Réformé'])
                ->default('En service');
            $table->string('qr_code')->nullable();

            $table->foreign('id_filiale', 'fk_equipement_filiale')
                ->references('id_filiale')->on('filiale')->onUpdate('cascade');

            $table->foreign('id_type_equipement', 'fk_equipement_type')
                ->references('id_type_equipement')->on('type_equipement')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipement');
    }
};