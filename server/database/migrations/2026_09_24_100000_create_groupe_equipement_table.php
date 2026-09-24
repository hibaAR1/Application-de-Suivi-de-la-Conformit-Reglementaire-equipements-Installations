<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Nouvelle table de référence "Groupe" pour la page "Données de base"
// (Administration) : jusqu'ici "Fixe"/"Mobile" n'étaient que du texte libre
// sur type_equipement.categorie, sans liste gérable par le super admin.
// On seed "Fixe" et "Mobile" pour ne pas casser l'existant.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groupe_equipement', function (Blueprint $table) {
            $table->integer('id_groupe_equipement', true, false);
            $table->string('libelle', 100)->unique();
        });

        \Illuminate\Support\Facades\DB::table('groupe_equipement')->insert([
            ['libelle' => 'Fixe'],
            ['libelle' => 'Mobile'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('groupe_equipement');
    }
};
