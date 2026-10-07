<?php

namespace App\Http\Controllers;

use App\Models\QuestionAssistant;

use App\Http\Controllers\Controller;
use App\Http\Requests\PoserRequest;
use App\Models\Controle;
use App\Models\Engin;
use App\Models\Equipement;
use App\Models\Reserve;
use App\Models\TypeEquipement;
use Illuminate\Support\Facades\Http;

/*
 * ============================================================================
 * CONTRÔLEUR : AssistantController  (routes /api/assistant/...)
 * ============================================================================
 *
 * RÔLE
 *   Assistant réglementaire basé sur l'IA (Gemini). Il répond aux questions
 *   libres et génère, pour un équipement OU un engin, un plan d'action et une
 *   liste de points de contrôle.
 *
 * ACTIONS
 *   poser()                  : question libre
 *   planAction()             : plan d'action d'un équipement
 *   pointsControle()         : points de contrôle d'un équipement
 *   planActionEngin()        : plan d'action d'un engin
 *   pointsControleEngin()    : points de contrôle d'un engin
 *
 * FONCTIONNEMENT
 *   Chaque action construit un texte (prompt) composé de trois parties :
 *   les règles de l'assistant (PERIMETRE), les données utiles (application
 *   ou fiche de l'équipement/engin), puis la demande. Ce texte est envoyé à
 *   Gemini, et la question avec sa réponse est enregistrée dans l'historique
 *   (table question_assistant).
 * ============================================================================
 */
class AssistantController extends Controller
{
    // Règles de l'assistant, envoyées en début de chaque prompt : domaine de
    // compétence, longueur des réponses, comportement hors sujet.
    private const PERIMETRE = <<<TEXT
Tu es l'assistant réglementaire interne de Ménara Holding (application de suivi de conformité réglementaire des équipements et installations électriques).

Tu peux répondre à deux types de questions :
1. La réglementation applicable : Décret n° 2-12-236, Lois 11-03/13-03/28-00/36-15/47-09, Code du Travail marocain, ISO 45001/14001.
2. L'état actuel de l'application (équipements, contrôles, réserves) — utilise les données fournies ci-dessous.

Règles strictes :
1. Réponds en 2 à 4 phrases MAXIMUM. Sois direct, sans formule de politesse longue.
2. Si la question ne concerne ni la réglementation ni les données de l'application (sujet totalement hors contexte), réponds juste : "Cette question sort du périmètre de l'assistant réglementaire. Contactez votre Référent HSE."
3. Ne donne jamais de conseil juridique définitif.
TEXT;

    // ------------------------------------------------------------------
    // CONTEXTE : résumé des données de l'application (pour les questions libres)
    // ------------------------------------------------------------------
    private function contexteDonnees(): string
    {
        $total = Equipement::count();

        $parFiliale = Equipement::selectRaw('id_filiale, count(*) as total')
            ->groupBy('id_filiale')
            ->with('filiale:id_filiale,libelle')
            ->get()
            ->map(fn ($row) => ($row->filiale->libelle ?? 'Filiale inconnue') . ': ' . $row->total)
            ->implode(', ');

        $controlesRetard = Controle::where('prochaine_echeance', '<', now())->count();
        $reservesOuvertes = Reserve::whereIn('statut', ['Ouverte', 'En cours'])->count();

        $types = TypeEquipement::all()
            ->map(fn ($t) => "{$t->libelle} ({$t->periodicite_controle} mois)")
            ->implode(', ');

        return "Données actuelles de l'application :\n"
            . "- Total équipements suivis : {$total}\n"
            . "- Répartition par filiale : {$parFiliale}\n"
            . "- Contrôles en retard (échéance dépassée) : {$controlesRetard}\n"
            . "- Réserves actuellement ouvertes : {$reservesOuvertes}\n"
            . "- Types d'équipement et périodicité : {$types}";
    }

    // ------------------------------------------------------------------
    // CONTEXTE : fiche résumée d'UN équipement
    // ------------------------------------------------------------------
    private function contexteEquipement(Equipement $eq): string
    {
        $type = $eq->typeEquipement;
        $caracteristiques = collect($eq->caracteristiques ?? [])
            ->map(fn ($valeur, $cle) => "{$cle}: {$valeur}")
            ->implode(', ');

        return "Équipement : {$eq->designation} ({$eq->id_equipement})\n"
            . 'Type : ' . ($type->libelle ?? '—') . ' (' . ($type->categorie ?? '—') . ")\n"
            . 'Filiale : ' . ($eq->filiale->libelle ?? '—') . ' — Site : ' . ($eq->site->libelle ?? '—') . "\n"
            . "Statut : {$eq->statut}\n"
            . 'Caractéristiques : ' . ($caracteristiques ?: 'non renseignées');
    }

    // ------------------------------------------------------------------
    // CONTEXTE : fiche résumée d'UN engin
    // ------------------------------------------------------------------
    // Même résumé que contexteEquipement(), pour un ENGIN (table "engin").
    private function contexteEngin(Engin $engin): string
    {
        $type = $engin->typeEquipement;
        $caracteristiques = collect($engin->caracteristiques ?? [])
            ->map(fn ($valeur, $cle) => "{$cle}: {$valeur}")
            ->implode(', ');

        return "Engin : {$engin->designation} ({$engin->id_engin})\n"
            . 'Type : ' . ($type->libelle ?? '—') . ' (' . ($type->categorie ?? '—') . ")\n"
            . 'Filiale : ' . ($engin->filiale->libelle ?? '—') . ' — Site : ' . ($engin->site->libelle ?? '—') . "\n"
            . "Statut : {$engin->statut}\n"
            . 'Caractéristiques : ' . ($caracteristiques ?: 'non renseignées');
    }

    // ------------------------------------------------------------------
    // APPEL à l'IA : envoie le prompt à Gemini et renvoie le texte de réponse
    // ------------------------------------------------------------------
    // Quand Gemini est momentanément surchargé (erreur 503) ou limité
    // (erreur 429), l'appel est retenté jusqu'à 3 fois, avec une pause de
    // 1,5 seconde entre chaque tentative.
    private function genererTexte(string $prompt): string
    {
        // La clé d'accès est lue dans la configuration (services.gemini.key).
        $apiKey = config('services.gemini.key');

        $response = Http::retry(3, 1500, null, false)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}",
            ['contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]]]
        );

        $texte = $response->json('candidates.0.content.parts.0.text');

        // Réponse vide ou inattendue : on garde une trace dans les logs pour
        // pouvoir diagnostiquer, et l'utilisateur reçoit un message d'erreur.
        if (!$texte) {
            \Log::error('Assistant IA — réponse Gemini inattendue', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        // Surcharge de Gemini (toujours présente après les 3 tentatives) : on
        // l'indique clairement, car l'utilisateur n'a rien d'autre à faire que
        // réessayer un peu plus tard.
        if (!$texte && in_array($response->status(), [429, 503], true)) {
            return "L'assistant IA est momentanément surchargé. Réessayez dans quelques instants.";
        }

        return $texte ?? 'Une erreur est survenue, réessayez ou contactez votre Référent HSE.';
    }

    // ------------------------------------------------------------------
    // HISTORIQUE : enregistre la question, la réponse et l'utilisateur
    // ------------------------------------------------------------------
    // $idEquipement vaut null pour une question libre ou pour un engin.
    private function journaliser(?string $idEquipement, string $question, string $reponse, string $thematique): void
    {
        QuestionAssistant::create([
            'id_utilisateur' => request()->user()->id_utilisateur,
            'id_equipement' => $idEquipement,
            'question' => $question,
            'reponse' => $reponse,
            'thematique' => $thematique,
            'date_heure' => now(),
        ]);
    }

    // ------------------------------------------------------------------
    // QUESTION LIBRE
    // ------------------------------------------------------------------
    public function poser(PoserRequest $request)
    {
        $data = $request->validated();

        $prompt = self::PERIMETRE . "\n\n" . $this->contexteDonnees() . "\n\nQuestion : " . $data['question'];
        $reponse = $this->genererTexte($prompt);

        $this->journaliser(null, $data['question'], $reponse, $data['thematique'] ?? 'question_libre');

        return response()->json(['reponse' => $reponse]);
    }

    // ------------------------------------------------------------------
    // PLAN D'ACTION d'un équipement
    // ------------------------------------------------------------------
    public function planAction($idEquipement)
    {
        $eq = Equipement::with(['typeEquipement', 'filiale', 'site'])->findOrFail($idEquipement);

        $prompt = self::PERIMETRE . "\n\n" . $this->contexteEquipement($eq)
            . "\n\nRédige un plan d'action de mise en conformité réglementaire pour cet équipement : "
            . '3 à 5 actions concrètes et priorisées, sous forme de liste à puces courte.';

        $reponse = $this->genererTexte($prompt);
        $this->journaliser($idEquipement, "Plan d'action", $reponse, 'plan_action');

        return response()->json(['reponse' => $reponse]);
    }

    // ------------------------------------------------------------------
    // POINTS DE CONTRÔLE d'un équipement
    // ------------------------------------------------------------------
    public function pointsControle($idEquipement)
    {
        $eq = Equipement::with(['typeEquipement', 'filiale', 'site'])->findOrFail($idEquipement);

        $prompt = self::PERIMETRE . "\n\n" . $this->contexteEquipement($eq)
            . "\n\nListe les points de contrôle réglementaires à vérifier lors du prochain contrôle de cet équipement : "
            . '4 à 6 points, sous forme de liste à puces courte.';

        $reponse = $this->genererTexte($prompt);
        $this->journaliser($idEquipement, 'Points de contrôle', $reponse, 'points_controle');

        return response()->json(['reponse' => $reponse]);
    }

    // ==================================================================
    // ENGINS (table "engin", séparée de "equipement")
    // ==================================================================
    // question_assistant.id_equipement référence la table "equipement" : on ne
    // peut pas y stocker l'identifiant d'un engin, donc ces appels sont
    // journalisés sans identifiant d'équipement (null), avec la question qui
    // contient l'identifiant de l'engin.

    // PLAN D'ACTION d'un engin
    public function planActionEngin($idEngin)
    {
        $engin = Engin::with(['typeEquipement', 'filiale', 'site'])->findOrFail($idEngin);

        $prompt = self::PERIMETRE . "\n\n" . $this->contexteEngin($engin)
            . "\n\nRédige un plan d'action de mise en conformité réglementaire pour cet engin : "
            . '3 à 5 actions concrètes et priorisées, sous forme de liste à puces courte.';

        $reponse = $this->genererTexte($prompt);
        $this->journaliser(null, "Plan d'action (engin {$idEngin})", $reponse, 'plan_action');

        return response()->json(['reponse' => $reponse]);
    }

    // POINTS DE CONTRÔLE d'un engin
    public function pointsControleEngin($idEngin)
    {
        $engin = Engin::with(['typeEquipement', 'filiale', 'site'])->findOrFail($idEngin);

        $prompt = self::PERIMETRE . "\n\n" . $this->contexteEngin($engin)
            . "\n\nListe les points de contrôle réglementaires à vérifier lors du prochain contrôle de cet engin : "
            . '4 à 6 points, sous forme de liste à puces courte.';

        $reponse = $this->genererTexte($prompt);
        $this->journaliser(null, "Points de contrôle (engin {$idEngin})", $reponse, 'points_controle');

        return response()->json(['reponse' => $reponse]);
    }
}
