<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupeEquipement extends Model
{
    protected $table = 'groupe_equipement';
    protected $primaryKey = 'id_groupe_equipement';
    public $timestamps = false;
    protected $fillable = ['libelle'];
}
