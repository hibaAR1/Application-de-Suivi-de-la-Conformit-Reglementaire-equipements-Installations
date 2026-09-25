import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Plate from "../../components/Plate";
import { apiFetch } from "../../utils/api";
import RoleModal from "../roles/RoleModal";

export default function UtilisateurForm() {
  const { id } = useParams(); // absent = création, présent = modification
  const navigate = useNavigate();
  const estModification = !!id;

  const [roles, setRoles] = useState([]);
  // Chargée uniquement pour pouvoir ouvrir RoleModal depuis le bouton "+"
  // à côté du champ Rôle ci-dessous (voir plus bas).
  const [permissions, setPermissions] = useState([]);
  const [modalRoleOuverte, setModalRoleOuverte] = useState(false);
  const [filiales, setFiliales] = useState([]);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    mot_de_passe: "",
    id_role: "",
    id_filiales: [],
    actif: true,
  });
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  function chargerRoles() {
    apiFetch("/roles")
      .then(setRoles)
      .catch(() => {});
  }

  useEffect(() => {
    chargerRoles();
    apiFetch("/permissions")
      .then(setPermissions)
      .catch(() => {});
    apiFetch("/filiales")
      .then(setFiliales)
      .catch(() => {});

    if (estModification) {
      apiFetch(`/utilisateurs/${id}`)
        .then((u) => {
          setForm({
            nom: u.nom,
            email: u.email,
            mot_de_passe: "",
            id_role: u.id_role ?? "",
            id_filiales: (u.filiales ?? []).map((f) => f.id_filiale),
            actif: !!u.actif,
          });
        })
        .catch((e) => setErreur(e.message));
    }
  }, [id]);

  function champ(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function basculerFiliale(idFiliale) {
    setForm((f) => {
      const deja = f.id_filiales.includes(idFiliale);
      return {
        ...f,
        id_filiales: deja
          ? f.id_filiales.filter((v) => v !== idFiliale)
          : [...f.id_filiales, idFiliale],
      };
    });
  }

  async function envoyer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);

    const payload = {
      nom: form.nom,
      email: form.email,
      id_role: form.id_role || null,
      id_filiales: form.id_filiales,
      actif: form.actif,
    };
    if (!estModification || form.mot_de_passe) {
      payload.mot_de_passe = form.mot_de_passe;
    }

    try {
      if (estModification) {
        await apiFetch(`/utilisateurs/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/utilisateurs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      navigate("/utilisateurs");
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 style={{ fontSize: "22px" }}>
            {estModification ? "Modifier" : "Nouvel"} utilisateur
          </h1>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 480 }}>
        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 12 }}
          >
            {erreur}
          </Plate>
        )}

        <Plate style={{ padding: 20 }}>
          <form
            onSubmit={envoyer}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="field">
              <label>Nom</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => champ("nom", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => champ("email", e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                {estModification
                  ? "Nouveau mot de passe (laisser vide pour ne pas changer)"
                  : "Mot de passe"}
              </label>
              <input
                type="password"
                required={!estModification}
                value={form.mot_de_passe}
                onChange={(e) => champ("mot_de_passe", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Rôle</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  required
                  value={form.id_role}
                  onChange={(e) => champ("id_role", e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">— Choisir —</option>
                  {roles.map((r) => (
                    <option key={r.id_role} value={r.id_role}>
                      {r.libelle}
                    </option>
                  ))}
                </select>
                {/* Ouvre la gestion des rôles (créer un rôle + cocher ses
                    permissions par module) sans quitter ce formulaire — le
                    rôle créé est automatiquement rechargé dans la liste
                    ci-dessus après enregistrement. */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  title="Créer un nouveau rôle"
                  onClick={() => setModalRoleOuverte(true)}
                  style={{ padding: "0 14px" }}
                >
                  +
                </button>
              </div>
            </div>

            <div className="field">
              <label>
                Filiales (laisser tout décoché si accès à toutes les filiales)
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                {filiales.map((f) => (
                  <label
                    key={f.id_filiale}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.id_filiales.includes(f.id_filiale)}
                      onChange={() => basculerFiliale(f.id_filiale)}
                    />
                    {f.libelle} ({f.code})
                  </label>
                ))}
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => champ("actif", e.target.checked)}
              />
              Compte actif
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={envoi}
              >
                {envoi ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/utilisateurs")}
              >
                Annuler
              </button>
            </div>
          </form>
        </Plate>
      </div>

      {modalRoleOuverte && (
        <RoleModal
          permissionsToutes={permissions}
          onClose={() => setModalRoleOuverte(false)}
          onEnregistre={(nouveauRole) => {
            chargerRoles();
            champ("id_role", nouveauRole.id_role);
          }}
        />
      )}
    </>
  );
}
