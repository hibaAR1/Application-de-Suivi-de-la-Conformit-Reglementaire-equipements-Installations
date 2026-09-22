<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site', function (Blueprint $table) {
            $table->id('id_site');
            $table->string('code');
            $table->string('libelle');
           $table->integer('id_filiale');

            $table->foreign('id_filiale')
                ->references('id_filiale')->on('filiale')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site');
    }
};