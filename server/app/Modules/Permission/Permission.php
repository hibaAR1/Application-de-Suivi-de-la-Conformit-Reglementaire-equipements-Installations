<?php

namespace App\Modules\Permission;

use App\Modules\Role\Role;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $table = 'permission';
    protected $primaryKey = 'id_permission';
    public $timestamps = false;

    protected $fillable = ['code', 'libelle'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permission', 'id_permission', 'id_role');
    }
}
