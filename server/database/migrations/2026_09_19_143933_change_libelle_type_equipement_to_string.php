<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('type_equipement', function (Blueprint $table) {
            $table->string('libelle', 100)->change();
        });
    }

    public function down(): void
    {
        Schema::table('type_equipement', function (Blueprint $table) {
            $table->enum('libelle', [
                'Engin mobile', 'Installation électrique',
                'Appareil de levage', 'Équipement sous pression', 'Autre',
            ])->change();
        });
    }
};
