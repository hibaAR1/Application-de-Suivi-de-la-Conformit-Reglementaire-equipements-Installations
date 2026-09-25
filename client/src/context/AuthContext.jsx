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

  // Changement de mot de passe obligatoire au premier login (voir
  // AuthController::changerMotDePasse côté serveur). Redemande le mot de
  // passe actuel même dans ce cas-là (sécurité).
  const changerMotDePasse = async (
    motDePasseActuel,
    nouveauMotDePasse,
    confirmation,
  ) => {
    const res = await fetch("http://127.0.0.1:8000/api/changer-mot-de-passe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mot_de_passe_actuel: motDePasseActuel,
        nouveau_mot_de_passe: nouveauMotDePasse,
        nouveau_mot_de_passe_confirmation: confirmation,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      const messageDetail =
        err.errors?.nouveau_mot_de_passe?.[0] ||
        err.errors?.mot_de_passe_actuel?.[0] ||
        err.message ||
        "Erreur lors du changement de mot de passe.";
      throw new Error(messageDetail);
    }

    const data = await res.json();
    setUtilisateur(data.utilisateur);
    localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
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
        // Vrai pour un compte tout juste créé par un admin (mot de passe
        // temporaire) : force le passage par /changer-mot-de-passe avant
        // d'accéder au reste de l'appli (voir ProtectedRoute.jsx).
        doitChangerMotPasse: Boolean(utilisateur.doit_changer_mot_passe),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!utilisateur,
        user,
        token,
        login,
        logout,
        changerMotDePasse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
