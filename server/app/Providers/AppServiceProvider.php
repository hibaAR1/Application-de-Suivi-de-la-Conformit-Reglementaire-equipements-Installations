<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Par défaut, Laravel enveloppe la réponse d'une Resource dans une
        // clé "data" (ex. {"data": [...]}). Le frontend attend les
        // tableaux/objets bruts (ex. juste [...]) comme avant l'ajout des
        // Resources — on désactive donc cet enveloppement globalement.
        JsonResource::withoutWrapping();
    }
}
