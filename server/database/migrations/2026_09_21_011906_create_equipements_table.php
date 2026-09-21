<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipement', function (Blueprint $table) {
            $table->string('id_equipement')->primary();
            $table->string('referentiel')->nullable();
            $table->foreignId('id_filiale')->nullable()->constrained('filiale', 'id_filiale');
            $table->string('id_type_equipement')->nullable();
            $table->string('designation');
            $table->string('marque_modele')->nullable();
            $table->string('numero_serie')->nullable();
            $table->date('date_mise_en_service')->nullable();
            $table->string('statut')->nullable();
            $table->string('qr_code')->nullable();
            $table->integer('periodicite_mois')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipement');
    }
};