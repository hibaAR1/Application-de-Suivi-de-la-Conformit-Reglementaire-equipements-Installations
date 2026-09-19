<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission', function (Blueprint $table) {
            $table->id('id_permission');
            $table->string('code')->unique(); // ex: 'equipements.create'
            $table->string('libelle');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission');
    }
};
