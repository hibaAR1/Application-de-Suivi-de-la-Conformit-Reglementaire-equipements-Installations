// Simulation de la "base de connaissance restreinte aux textes réglementaires
// listés en section 1" (§3.3 du CDC). Le vrai moteur (backend) doit refuser
// toute question hors de ce périmètre — ici on le simule avec des réponses
// pré-écrites pour la démo frontend.

export const THEMATIQUES = [
  { id: 'levage', label: 'Appareils de levage', reference: 'Décret n° 2-12-236' },
  { id: 'electrique', label: 'Installations électriques', reference: 'Code du Travail marocain' },
  { id: 'pression', label: 'Équipements sous pression', reference: 'Décret n° 2-12-236' },
  { id: 'environnement', label: 'Environnement & déchets', reference: 'Lois 11-03 / 13-03 / 28-00' },
];

const REPONSES = {
  levage:
    "Les appareils de levage relèvent du Décret n° 2-12-236, qui impose un contrôle technique périodique. " +
    'La périodicité exacte dépend du type d\'appareil (voir la fiche "Type d\'équipement" dans le module Équipements).',
  electrique:
    'Les installations électriques doivent respecter le Code du Travail marocain en matière de sécurité électrique. ' +
    "Un contrôle périodique est requis, avec traçabilité des rapports (PDF, 10 Mo max) dans la fiche contrôle.",
  pression:
    'Les équipements sous pression sont couverts par le Décret n° 2-12-236 (contrôle technique des équipements sous pression et de levage), au même titre que les appareils de levage.',
  environnement:
    'Les obligations environnementales relèvent des lois 11-03 (environnement), 13-03 (pollution de l\'air) et 28-00 (gestion des déchets). ' +
    'Ces textes ne sont pas directement liés à un équipement individuel mais au fonctionnement du site.',
};

const HORS_PERIMETRE =
  "Je suis restreint aux textes réglementaires listés dans le cahier des charges " +
  '(Décret 2-12-236, Lois 11-03/13-03/28-00/36-15/47-09, Code du Travail, ISO 45001/14001). ' +
  'Pour toute autre question, merci de contacter votre Référent HSE.';

export function reponseAssistant(thematiqueId) {
  return REPONSES[thematiqueId] ?? HORS_PERIMETRE;
}

export function reponseHorsPerimetre() {
  return HORS_PERIMETRE;
}
