<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->integer('id_utilisateur', true, false);
            $table->string('nom', 150);
            $table->string('email', 150)->unique();
            $table->string('mot_de_passe');
            $table->integer('id_filiale')->nullable();
            $table->integer('id_role');
            $table->boolean('actif')->default(true);
            $table->dateTime('date_creation')->useCurrent();

            $table->foreign('id_filiale', 'fk_utilisateur_filiale')
                ->references('id_filiale')->on('filiale')
                ->onDelete('set null')->onUpdate('cascade');

            $table->foreign('id_role', 'fk_utilisateur_role')
                ->references('id_role')->on('role')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur');
    }
};