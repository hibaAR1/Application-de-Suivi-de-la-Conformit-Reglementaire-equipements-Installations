<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Filiale extends Model
{
    protected $table = 'filiale';
    protected $primaryKey = 'id_filiale';
    public $timestamps = false;

    protected $fillable = ['libelle', 'code'];

    public function sites()
    {
        return $this->hasMany(Site::class, 'id_filiale');
    }

    public function equipements()
    {
        return $this->hasMany(Equipement::class, 'id_filiale');
    }

    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_filiale');
    }
}
