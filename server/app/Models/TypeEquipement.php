<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TypeEquipement extends Model
{
    protected $table = 'type_equipement';
    protected $primaryKey = 'id_type_equipement';
    public $timestamps = false;
    protected $fillable = ['libelle', 'periodicite_controle'];
}
