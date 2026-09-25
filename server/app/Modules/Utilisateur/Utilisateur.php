<?php

namespace App\Modules\Utilisateur;

use App\Modules\Filiale\Filiale;
use App\Modules\Role\Role;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Model
{
    use HasApiTokens;

    protected $table = 'utilisateur';
    protected $primaryKey = 'id_utilisateur';
    public $timestamps = false;

    protected $fillable = ['nom', 'email', 'mot_de_passe', 'id_filiale', 'id_role', 'actif', 'doit_changer_mot_passe'];
    protected $hidden = ['mot_de_passe'];
    // Sans ça, actif/doit_changer_mot_passe ressortent comme 1/0 au lieu de
    // true/false dans le JSON (inoffensif côté React qui teste juste la
    // "vérité" de la valeur, mais plus correct et plus sûr ainsi).
    protected $casts = ['actif' => 'boolean', 'doit_changer_mot_passe' => 'boolean'];

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function filiale()
    {
        return $this->belongsTo(Filiale::class, 'id_filiale');
    }

    // Nouvelle relation multi-filiales : un utilisateur (ex. Référent HSE)
    // peut être rattaché à plusieurs filiales précises.
    public function filiales()
    {
        return $this->belongsToMany(Filiale::class, 'utilisateur_filiale', 'id_utilisateur', 'id_filiale');
    }

    public function hasPermission(string $code): bool
    {
        return $this->role?->permissions->contains('code', $code) ?? false;
    }
}
