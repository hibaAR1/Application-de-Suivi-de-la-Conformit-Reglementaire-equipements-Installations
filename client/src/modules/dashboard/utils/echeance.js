// §3.2 du CDC — "Moteur d'alertes : Calcul automatique du statut d'échéance
// (J-30, J-15, J-0, en retard)". Ici calculé côté client à partir de la date du
// jour réelle (Date.now()) — le vrai moteur (job planifié quotidien, cf. CDC)
// doit tourner côté serveur pour déclencher aussi les notifications email.
export function statutEcheance(dateISO) {
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  const echeance = new Date(dateISO);
  const joursRestants = Math.round((echeance - aujourdHui) / (1000 * 60 * 60 * 24));

  if (joursRestants < 0) return 'retard';
  if (joursRestants === 0) return 'j0';
  if (joursRestants <= 15) return 'j15';
  if (joursRestants <= 30) return 'j30';
  return 'ok';
}

export function formatDateFR(dateISO) {
  const d = new Date(dateISO);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
