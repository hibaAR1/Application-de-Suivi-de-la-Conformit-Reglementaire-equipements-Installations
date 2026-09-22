<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_audit', function (Blueprint $table) {
            $table->integer('id_journal', true, false);
            $table->integer('id_utilisateur');
            $table->enum('action', ['création', 'modification', 'suppression']);
            $table->string('entite_concernee', 100);
            $table->string('id_entite_concernee', 50)->nullable();
            $table->dateTime('date_heure')->useCurrent();

            $table->foreign('id_utilisateur', 'fk_journal_utilisateur')
                ->references('id_utilisateur')->on('utilisateur');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_audit');
    }
};