<?php

namespace App\Modules\Assistant;

use Illuminate\Database\Eloquent\Model;

class QuestionAssistant extends Model
{
    protected $table = 'question_assistant';
    protected $primaryKey = 'id_question';
    public $timestamps = false;
    protected $fillable = ['id_utilisateur', 'id_equipement', 'question', 'reponse', 'thematique', 'date_heure'];
}
