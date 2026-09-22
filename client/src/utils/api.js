const BASE_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      // Avec FormData, le navigateur met lui-même le Content-Type (multipart + boundary)
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
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