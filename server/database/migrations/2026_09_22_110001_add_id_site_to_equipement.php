<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipement', function (Blueprint $table) {
            $table->unsignedBigInteger('id_site')->nullable()->after('id_filiale');

            $table->foreign('id_site')
                ->references('id_site')->on('site')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('equipement', function (Blueprint $table) {
            $table->dropForeign(['id_site']);
            $table->dropColumn('id_site');
        });
    }
};