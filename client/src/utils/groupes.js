// Liste des "groupes" personnalisés (en plus de Fixe/Mobile) créés par
// l'utilisatrice, depuis la popup "+ Nouveau groupe" ou "+ Nouveau type".
// Il n'y a pas de table dédiée côté base de données (le groupe est juste un
// texte libre sur type_equipement.categorie), donc on garde ceux créés sans
// type rattaché dans le navigateur, pour qu'ils restent proposés ensuite.
const CLE = "menara_groupes_personnalises";

export function getGroupesPersonnalises() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

export function ajouterGroupePersonnalise(nom) {
  const groupes = getGroupesPersonnalises();
  if (nom && !groupes.includes(nom)) {
    groupes.push(nom);
    try {
      localStorage.setItem(CLE, JSON.stringify(groupes));
    } catch {
      // stockage indisponible (navigation privée, etc.) — tant pis, non bloquant
    }
  }
  return groupes;
}
