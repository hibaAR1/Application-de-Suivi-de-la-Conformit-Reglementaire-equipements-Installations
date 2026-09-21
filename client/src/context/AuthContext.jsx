import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function getInitiales(nom) {
  if (!nom) return "?";
  return nom
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(
    JSON.parse(localStorage.getItem("utilisateur")) || null,
  );
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const login = async (email, mot_de_passe) => {
    const res = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, mot_de_passe }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Erreur de connexion");
    }

    const data = await res.json();
    setUtilisateur(data.utilisateur);
    setToken(data.token);
    localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
    localStorage.setItem("token", data.token);
  };

  const logout = async () => {
    if (token) {
      await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUtilisateur(null);
    setToken(null);
    localStorage.removeItem("utilisateur");
    localStorage.removeItem("token");
  };

  const permissions = utilisateur?.role?.permissions?.map((p) => p.code) ?? [];
  // Un utilisateur peut désormais être rattaché à plusieurs filiales précises.
  const filiales = utilisateur?.filiales ?? [];

  const user = utilisateur
    ? {
        nom: utilisateur.nom,
        role: utilisateur.role?.libelle ?? "",
        idFiliales: filiales.map((f) => f.id_filiale), // tableau, vide = toutes filiales
        filialesCodes: filiales.map((f) => f.code),
        filialeCode: filiales[0]?.code ?? null, // filiale "par défaut" pour le thème/sidebar
        filialeLibelle: filiales.length
          ? filiales.map((f) => f.libelle).join(", ")
          : "Toutes filiales",
        initiales: getInitiales(utilisateur.nom),
        permissions,
        hasPermission: (code) => permissions.includes(code),
        voitToutesFiliales: permissions.includes("dashboard.groupe.view"),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!utilisateur, user, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
