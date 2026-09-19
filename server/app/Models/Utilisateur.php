<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Model
{
    use HasApiTokens;

    protected $table = 'utilisateur';
    protected $primaryKey = 'id_utilisateur';
    public $timestamps = false;

    protected $fillable = ['nom', 'email', 'mot_de_passe', 'id_filiale', 'id_role', 'actif'];
    protected $hidden = ['mot_de_passe'];

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function filiale()
    {
        return $this->belongsTo(Filiale::class, 'id_filiale');
    }
    public function hasPermission(string $code): bool
{
    return $this->role?->permissions->contains('code', $code) ?? false;
}
}
