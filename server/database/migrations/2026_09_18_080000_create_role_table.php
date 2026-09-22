<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role', function (Blueprint $table) {
            $table->integer('id_role', true, false);
            $table->enum('libelle', [
                'Technicien terrain', 'Référent HSE filiale', 'Administrateur SMI Holding',
                'Consultation Direction', 'Super Admin',
            ])->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role');
    }
};