
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Réserves des ENGINS : table séparée de "reserve" (celle des équipements),
// liée à "controle_engin". Elle reprend directement la structure FINALE de
// "reserve" (valeurs Critique / Clôturée, responsable, action corrective),
// sans repasser par toutes les migrations intermédiaires.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reserve_engin', function (Blueprint $table) {
            $table->integer('id_reserve_engin', true, false);
            $table->integer('id_controle_engin');
            $table->text('nature_reserve');
            $table->enum('niveau_criticite', ['Mineure', 'Majeure', 'Critique']);
            $table->string('responsable')->nullable();
            $table->text('action_corrective')->nullable();
            $table->date('delai_levee')->nullable();
            $table->enum('statut', ['Ouverte', 'En cours', 'Clôturée'])->default('Ouverte');
            $table->string('justificatif_levee')->nullable();
            $table->date('date_levee_effective')->nullable();

            $table->foreign('id_controle_engin', 'fk_reserve_engin_controle')
                ->references('id_controle_engin')->on('controle_engin')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reserve_engin');
    }
};
