<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Controle;
use App\Models\Equipement;
use App\Models\QuestionAssistant;
use App\Models\Reserve;
use App\Models\TypeEquipement;
use Illuminate\Http\Request;
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

    public function poser(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|max:1000',
            'thematique' => 'nullable|string',
        ]);

        $apiKey = config('services.gemini.key');
        $prompt = self::PERIMETRE . "\n\n" . $this->contexteDonnees() . "\n\nQuestion : " . $data['question'];

        $response = Http::post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}",
            ['contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]]]
        );

        $reponseTexte = $response->json('candidates.0.content.parts.0.text')
            ?? "Une erreur est survenue, réessayez ou contactez votre Référent HSE.";

        QuestionAssistant::create([
            'id_utilisateur' => $request->user()->id_utilisateur,
            'id_equipement' => null,
            'question' => $data['question'],
            'reponse' => $reponseTexte,
            'thematique' => $data['thematique'] ?? null,
            'date_heure' => now(),
        ]);

        return response()->json(['reponse' => $reponseTexte]);
    }
}
