<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reserve extends Model
{
    protected $table = 'reserve';
    protected $primaryKey = 'id_reserve';
    public $timestamps = false;

    protected $fillable = [
        'id_controle', 'nature_reserve', 'niveau_criticite',
        'delai_levee', 'statut', 'justificatif_levee', 'date_levee_effective',
    ];

    public function controle()
    {
        return $this->belongsTo(Controle::class, 'id_controle');
    }

        // Délais dyal levée b l youm, 3la 7sab criticité.
    // ⚠️ Hado placeholders (ana khtarthom), khassk nswl lamia 3la l délais réglementaires s7a7
    // o nbdlhum hna mnin ykono m3roufin.
    public const DELAIS_JOURS = ['Bloquante' => 30, 'Majeure' => 90, 'Mineure' => 180];

    /**
     * Kayhseb la date li fiha khass treserve tkon mlia (levée).
     * $criticite: 'Mineure' | 'Majeure' | 'Bloquante'
     * $dateControle: date dyal contrôle (string, mtln '2026-09-21')
     * Kayrje3: date f string (mtln '2026-12-20')
     */
    public static function calculerDelai(string $criticite, string $dateControle): string
    {
        return \Carbon\Carbon::parse($dateControle)
            ->addDays(self::DELAIS_JOURS[$criticite]) // kayzid l 3adad dyal ayam 3la 7sab criticité
            ->toDateString(); // kayrje3ha f format 'YYYY-MM-DD'
    }
}
