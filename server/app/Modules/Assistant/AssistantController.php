<?php

namespace App\Modules\Assistant;

use App\Http\Controllers\Controller;
use App\Modules\Assistant\Requests\PoserRequest;
use App\Modules\Controle\Controle;
use App\Modules\Equipement\Equipement;
use App\Modules\Reserve\Reserve;
use App\Modules\TypeEquipement\TypeEquipement;
use Illuminate\Support\Facades\Http;

class AssistantController extends Controller
{
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
        $reservesOuvertes = Reserve::whereIn('statut', ['Ouverte', 'En cours', 'En retard'])->count();

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

       private function genererTexte(string $prompt): string
    {
        $apiKey = config('services.gemini.key');

        $response = Http::post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}",
            ['contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]]]
        );

        $texte = $response->json('candidates.0.content.parts.0.text');

        if (!$texte) {
            \Log::error('Assistant IA — réponse Gemini inattendue', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $texte ?? 'Une erreur est survenue, réessayez ou contactez votre Référent HSE.';
    }

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

    public function poser(PoserRequest $request)
    {
        $data = $request->validated();

        $prompt = self::PERIMETRE . "\n\n" . $this->contexteDonnees() . "\n\nQuestion : " . $data['question'];
        $reponse = $this->genererTexte($prompt);

        $this->journaliser(null, $data['question'], $reponse, $data['thematique'] ?? 'question_libre');

        return response()->json(['reponse' => $reponse]);
    }

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
}
