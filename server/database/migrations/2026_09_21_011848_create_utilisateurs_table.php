<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('mot_de_passe');
            $table->foreignId('id_filiale')->nullable()->constrained('filiale', 'id_filiale');
            $table->foreignId('id_role')->nullable()->constrained('role', 'id_role');
            $table->boolean('actif')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur');
    }
};