<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_permission', function (Blueprint $table) {
            $table->id();
            $table->integer('id_role');
            $table->foreignId('id_permission')->constrained('permission', 'id_permission')->cascadeOnDelete();

            $table->foreign('id_role')->references('id_role')->on('role')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permission');
    }
};