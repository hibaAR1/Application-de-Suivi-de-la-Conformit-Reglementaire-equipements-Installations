/*
 * ============================================================================
 * API : appels HTTP vers le serveur Laravel
 * ============================================================================
 *
 * CONTENU
 *   - apiFetch()  : fonction de base utilisée par TOUS les appels à l'API
 *   - fonctions utilitaires pour les contrôles et réserves, d'abord des
 *     équipements puis des engins (envoi de fichiers, donc en FormData)
 * ============================================================================
 */

// Adresse de base de l'API Laravel.
const BASE_URL = "http://127.0.0.1:8000/api";

// ------------------------------------------------------------------
// apiFetch : appel générique à l'API
// ------------------------------------------------------------------
// - ajoute automatiquement le jeton de connexion (en-tête Authorization)
// - envoie du JSON, ou un FormData tel quel (cas des fichiers PDF/images)
// - renvoie la réponse JSON, ou lève une Error avec le message du serveur
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      // Pour un FormData, le navigateur fixe lui-même le Content-Type
      // (il y ajoute la limite des parties du fichier).
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/login")) {
      // Erreur 401 = le jeton stocké dans le navigateur n'est plus valide
      // côté serveur (jeton révoqué, base réinitialisée...), alors que
      // l'application croit encore l'utilisateur connecté. On efface donc
      // les données de session et on renvoie vers la page de connexion.
      localStorage.removeItem("utilisateur");
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur API (${res.status})`);
  }

  return res.json();
}

// ------------------------------------------------------------------
// Équipements : contrôles et réserves
// ------------------------------------------------------------------
export const getControles = () => apiFetch("/controles");

export const creerControle = (formData) =>
  apiFetch("/controles", { method: "POST", body: formData });

// Laravel ne lit pas le multipart sur PUT : on envoie un POST avec _method=PUT
export const mettreAJourReserve = (idReserve, formData) => {
  formData.append("_method", "PUT");
  return apiFetch(`/reserves/${idReserve}`, { method: "POST", body: formData });
};

// ------------------------------------------------------------------
// Engins : contrôles et réserves
// (tables séparées : controle_engin / reserve_engin)
// ------------------------------------------------------------------
export const getControlesEngin = () => apiFetch("/controles-engin");

export const creerControleEngin = (formData) =>
  apiFetch("/controles-engin", { method: "POST", body: formData });

// Même contournement que pour les équipements : POST + _method=PUT.
export const mettreAJourReserveEngin = (idReserveEngin, formData) => {
  formData.append("_method", "PUT");
  return apiFetch(`/reserves-engin/${idReserveEngin}`, {
    method: "POST",
    body: formData,
  });
};
