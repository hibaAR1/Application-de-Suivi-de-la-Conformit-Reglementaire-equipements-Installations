<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rapport_controle', function (Blueprint $table) {
            $table->integer('id_rapport', true, false);
            $table->string('id_equipement', 50);
            $table->date('date_rapport');
            $table->string('organisme', 150);
            $table->string('reference', 100)->nullable();
            $table->string('chemin_pdf')->nullable();
            $table->text('constatations')->nullable();
            $table->dateTime('date_creation')->useCurrent();

            $table->foreign('id_equipement', 'fk_rapport_equipement')
                ->references('id_equipement')->on('equipement')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapport_controle');
    }
};
