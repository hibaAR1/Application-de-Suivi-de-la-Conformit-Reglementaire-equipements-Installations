<?php

namespace App\Modules\Role;

use App\Modules\Permission\Permission;
use App\Modules\Utilisateur\Utilisateur;
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

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission', 'id_role', 'id_permission');
    }
}
