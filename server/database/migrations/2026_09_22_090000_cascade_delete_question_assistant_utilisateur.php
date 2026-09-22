<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('question_assistant', function (Blueprint $table) {
            $table->dropForeign('fk_question_utilisateur');
        });

        Schema::table('question_assistant', function (Blueprint $table) {
            $table->foreign('id_utilisateur', 'fk_question_utilisateur')
                ->references('id_utilisateur')->on('utilisateur')
                ->onUpdate('cascade');
        });
    }
};