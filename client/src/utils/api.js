const BASE_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/login")) {
      // Le jeton stocké dans le navigateur n'est plus valide côté serveur
      // (ex. token révoqué, base de données réinitialisée) alors que
      // AuthContext croyait encore l'utilisateur connecté (il ne se fiait
      // qu'à la présence de "utilisateur" en localStorage, jamais vérifiée
      // contre le serveur). Résultat : tous les appels échouaient en boucle
      // en 401 sans jamais renvoyer vers /login. On nettoie et on renvoie
      // vers la connexion nous-mêmes dès qu'un 401 survient.
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

export const getControles = () => apiFetch("/controles");

export const creerControle = (formData) =>
  apiFetch("/controles", { method: "POST", body: formData });

// Laravel ne lit pas le multipart sur PUT : on envoie un POST avec _method=PUT
export const mettreAJourReserve = (idReserve, formData) => {
  formData.append("_method", "PUT");
  return apiFetch(`/reserves/${idReserve}`, { method: "POST", body: formData });
};
