<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('type_equipement', function (Blueprint $table) {
            $table->text('caracteristiques_definition')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('type_equipement', function (Blueprint $table) {
            $table->dropColumn('caracteristiques_definition');
        });
    }
};
