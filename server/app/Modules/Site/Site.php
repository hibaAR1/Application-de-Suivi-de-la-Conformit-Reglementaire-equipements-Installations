<?php

namespace App\Modules\Site;

use App\Modules\Equipement\Equipement;
use App\Modules\Filiale\Filiale;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $table = 'site';
    protected $primaryKey = 'id_site';
    public $timestamps = false;

    protected $fillable = ['code', 'libelle', 'id_filiale'];

    public function filiale()
    {
        return $this->belongsTo(Filiale::class, 'id_filiale');
    }

    public function equipements()
    {
        return $this->hasMany(Equipement::class, 'id_site');
    }
}
