<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'role';
    protected $primaryKey = 'id_role';
    public $timestamps = false;

    protected $fillable = ['libelle'];

    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_role');
    }
}
