import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getControles, creerControle, mettreAJourReserve } from '../utils/api';
import { useAuth } from './AuthContext';

// §3.2 du CDC — "Délai de levée réglementaire... Selon criticité", sans valeur chiffrée.
// Valeurs provisoires pour que la logique fonctionne ; à faire valider avec la Direction SMI
// (les mêmes valeurs doivent être alignées côté backend, dans Reserve.php).
export const DELAI_LEVEE_PAR_CRITICITE = { Bloquante: 7, Majeure: 30, Mineure: 90 };
export const NIVEAUX_CRITICITE = Object.keys(DELAI_LEVEE_PAR_CRITICITE);
export const RESULTATS_CONTROLE = ['Favorable', 'Favorable avec réserves', 'Défavorable'];

// Le backend renvoie les données en snake_case (id_equipement, date_controle...)
// avec un tableau "reserves". Le front (Controles.jsx, ReserveForm.jsx) attend du
// camelCase et une seule réserve par contrôle (singulier).
// Cette fonction fait la conversion pour ne pas avoir à toucher aux pages existantes.
function normaliserControle(c) {
  const premiereReserve = c.reserves && c.reserves.length > 0 ? c.reserves[0] : null;
  return {
    id: c.id_controle,
    equipementRef: c.id_equipement,
    dateControle: c.date_controle,
    organisme: c.organisme_controle,
    resultat: c.resultat_global,
    prochaineEcheance: c.prochaine_echeance,
    reserve: premiereReserve
      ? {
          idReserve: premiereReserve.id_reserve, // nécessaire pour l'appel PUT /api/reserves/{id}
          nature: premiereReserve.nature_reserve,
          criticite: premiereReserve.niveau_criticite,
          statut: premiereReserve.statut,
          delaiLevee: premiereReserve.delai_levee,
          justificatif: premiereReserve.justificatif_levee,
          dateLeveeEffective: premiereReserve.date_levee_effective,
        }
      : null,
  };
}

const ControlesContext = createContext(null);

export function ControlesProvider({ children }) {
  const { token } = useAuth(); // token de connexion — sert à déclencher un rechargement après login/logout
  const [controles, setControles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Récupère la liste des contrôles depuis l'API (remplace l'ancien SEED statique)
  const rafraichir = useCallback(async () => {
    setChargement(true);
    try {
      const data = await getControles();
      setControles(data.map(normaliserControle));
      setErreur(null);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  // Recharge la liste dès que le token change : au premier login, et à chaque
  // reconnexion. Sans "token" en dépendance, le fetch initial se ferait avant
  // que l'utilisateur soit connecté (token encore null) et ne se relancerait jamais.
  useEffect(() => {
    if (token) {
      rafraichir();
    } else {
      setControles([]);
      setChargement(false);
    }
  }, [token, rafraichir]);

  // §3.2 : saisie d'un contrôle. Envoie un vrai POST au backend, qui calcule
  // lui-même prochaine_echeance à partir de la périodicité de l'équipement.
  async function ajouterControle({ equipementRef, dateControle, organisme, resultat, reserveInfo, rapport }) {
    const fd = new FormData();
    fd.append('id_equipement', equipementRef);
    fd.append('date_controle', dateControle);
    fd.append('organisme_controle', organisme);
    fd.append('resultat_global', resultat);
    if (rapport) fd.append('rapport', rapport); // fichier PDF réel, si fourni

    if (resultat === 'Favorable avec réserves' && reserveInfo) {
      fd.append('reserves[0][nature_reserve]', reserveInfo.nature);
      fd.append('reserves[0][niveau_criticite]', reserveInfo.criticite);
    }

    const nouveau = await creerControle(fd);
    const normalise = normaliserControle(nouveau);
    setControles((prev) => [normalise, ...prev]);
    return normalise;
  }

  // §3.2 : "Justificatif de levée" + "Date de levée effective".
  // fichier = le véritable objet File (input type="file"), pas juste son nom.
  async function leverReserve(controleId, { fichier, dateLeveeEffective }) {
    const controle = controles.find((c) => c.id === controleId);
    if (!controle?.reserve?.idReserve) return;

    const fd = new FormData();
    fd.append('statut', 'Levée');
    fd.append('date_levee_effective', dateLeveeEffective);
    if (fichier) fd.append('justificatif_levee', fichier);

    await mettreAJourReserve(controle.reserve.idReserve, fd);
    await rafraichir(); // on recharge la liste pour refléter le changement
  }

  function reservesDe(equipementRef) {
    return controles.filter((c) => c.equipementRef === equipementRef && c.reserve);
  }

  const value = { controles, chargement, erreur, ajouterControle, leverReserve, reservesDe, rafraichir };
  return <ControlesContext.Provider value={value}>{children}</ControlesContext.Provider>;
}

export function useControles() {
  const ctx = useContext(ControlesContext);
  if (!ctx) throw new Error('useControles() doit être utilisé à l\'intérieur de <ControlesProvider>.');
  return ctx;
}