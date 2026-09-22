<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('type_equipement', function (Blueprint $table) {
            $table->integer('id_type_equipement', true, false);
            $table->enum('libelle', [
                'Engin mobile', 'Installation électrique',
                'Appareil de levage', 'Équipement sous pression', 'Autre',
            ]);
            $table->integer('periodicite_controle');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('type_equipement');
    }
};