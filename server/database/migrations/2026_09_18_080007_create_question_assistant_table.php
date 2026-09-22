<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_assistant', function (Blueprint $table) {
            $table->integer('id_question', true, false);
            $table->integer('id_utilisateur');
            $table->string('id_equipement', 50)->nullable();
            $table->string('thematique', 150)->nullable();
            $table->text('question');
            $table->text('reponse')->nullable();
            $table->dateTime('date_heure')->useCurrent();

            $table->foreign('id_equipement', 'fk_question_equipement')
                ->references('id_equipement')->on('equipement')
                ->onDelete('set null');

            // Volontairement sans "cascade" ici : la migration
            // 2026_09_22_090000_cascade_delete_question_assistant_utilisateur
            // vient ensuite ajouter le "on delete cascade" sur cette même contrainte.
            $table->foreign('id_utilisateur', 'fk_question_utilisateur')
                ->references('id_utilisateur')->on('utilisateur');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_assistant');
    }
};