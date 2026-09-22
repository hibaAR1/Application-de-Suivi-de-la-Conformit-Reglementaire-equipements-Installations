
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('filiale', function (Blueprint $table) {
            $table->integer('id_filiale', true, false);
            $table->string('libelle', 150);
            $table->enum('code', ['MP', 'CTM', 'MT', 'ML', 'TCGM'])->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filiale');
    }
};