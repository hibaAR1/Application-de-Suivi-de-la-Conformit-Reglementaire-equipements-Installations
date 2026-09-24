<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// La contrainte fk_question_utilisateur bloquait la suppression d'un utilisateur
// dès qu'il avait posé une question à l'assistant (aucune règle ON DELETE définie
// = RESTRICT par défaut). On la remplace par ON DELETE CASCADE : supprimer un
// utilisateur supprime aussi son historique de questions à l'assistant.
//
// SQLite ne sait pas supprimer une contrainte de clé étrangère nommée (utilisé
// uniquement par les tests PHPUnit) — sur ce driver, cette migration ne fait
// donc rien : sans intérêt pour les tests de ce module, qui ne portent pas sur
// question_assistant. En base réelle (SQL Server), le comportement d'origine
// est inchangé.
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            return;
        }

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
        if (DB::getDriverName() !== 'sqlsrv') {
            return;
        }

        Schema::table('question_assistant', function (Blueprint $table) {
            $table->dropForeign('fk_question_utilisateur');
        });

        Schema::table('question_assistant', function (Blueprint $table) {
            $table->foreign('id_utilisateur', 'fk_question_utilisateur')
                ->references('id_utilisateur')->on('utilisateur');
        });
    }
};