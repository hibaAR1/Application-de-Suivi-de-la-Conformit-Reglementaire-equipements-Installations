<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// La contrainte fk_question_utilisateur bloquait la suppression d'un utilisateur
// dès qu'il avait posé une question à l'assistant (aucune règle ON DELETE définie
// = RESTRICT par défaut). On la remplace par ON DELETE CASCADE : supprimer un
// utilisateur supprime aussi son historique de questions à l'assistant.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('question_assistant', function (Blueprint $table) {
            $table->dropForeign('fk_question_utilisateur');
        });

        Schema::table('question_assistant', function (Blueprint $table) {
            $table->foreign('id_utilisateur', 'fk_question_utilisateur')
                ->references('id_utilisateur')->on('utilisateur')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('question_assistant', function (Blueprint $table) {
            $table->dropForeign('fk_question_utilisateur');
        });

        Schema::table('question_assistant', function (Blueprint $table) {
            $table->foreign('id_utilisateur', 'fk_question_utilisateur')
                ->references('id_utilisateur')->on('utilisateur');
        });
    }
};