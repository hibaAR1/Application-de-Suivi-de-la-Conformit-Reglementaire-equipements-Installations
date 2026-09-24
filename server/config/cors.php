<?php

// Adresse exacte du site une fois en ligne (ex. https://conformite.menara.ma),
// à renseigner dans .env sous FRONTEND_URL quand l'application sera
// déployée sur un vrai serveur. Tant que cette variable n'existe pas (donc
// en local, comme actuellement), on reste en mode développement : n'importe
// quel port sur localhost/127.0.0.1 est autorisé, car Vite change de port
// (8080, 5174, ...) dès que 5173 est déjà occupé.
$urlFrontendProduction = env('FRONTEND_URL');

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Dès que FRONTEND_URL est défini (en production), seule cette adresse
    // précise est autorisée — plus aucun port localhost, même en secours.
    'allowed_origins' => $urlFrontendProduction ? [$urlFrontendProduction] : [],

    'allowed_origins_patterns' => $urlFrontendProduction
        ? []
        : ['#^http://(localhost|127\.0\.0\.1):\d+$#'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
