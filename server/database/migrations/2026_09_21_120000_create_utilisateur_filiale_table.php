<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Table de liaison : un utilisateur (Référent HSE, Technicien terrain, ...)
// peut désormais être rattaché à plusieurs filiales précises, en plus des
// cas "une seule filiale" et "toutes les filiales" déjà prévus par le CDC.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateur_filiale', function (Blueprint $table) {
            $table->unsignedBigInteger('id_utilisateur');
            $table->unsignedBigInteger('id_filiale');
            $table->primary(['id_utilisateur', 'id_filiale']);

            $table->foreign('id_utilisateur')
                ->references('id_utilisateur')->on('utilisateur')
                ->onDelete('cascade');

            $table->foreign('id_filiale')
                ->references('id_filiale')->on('filiale')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur_filiale');
    }
};
