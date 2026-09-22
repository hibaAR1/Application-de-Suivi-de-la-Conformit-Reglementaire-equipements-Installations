import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Plate from "../components/Plate";
import {
  useEquipements,
  STATUTS_EQUIPEMENT,
} from "../context/EquipementsContext";

// §3.1 du CDC — tous les champs obligatoires de la "fiche équipement",
// sauf Identifiant et QR code qui sont générés automatiquement (non saisis ici).
export default function EquipementForm() {
  const { ref } = useParams(); // présent = modification, absent = création
  const navigate = useNavigate();
  const {
    getByRef,
    creerEquipement,
    modifierEquipement,
    filiales,
    sitesDeFiliale,
    typesEquipement,
  } = useEquipements();
  const existant = ref ? getByRef(ref) : null;

  const [form, setForm] = useState(
    existant
      ? {
          codeFiliale: existant.filiale?.code ?? "",
          id_site: existant.id_site ?? "",
          id_type_equipement: existant.id_type_equipement,
          designation: existant.designation ?? "",
          marque_modele: existant.marque_modele ?? "",
          numero_serie: existant.numero_serie ?? "",
          date_mise_en_service: existant.date_mise_en_service ?? "",
          statut: existant.statut ?? "En service",
        }
      : {
          codeFiliale: filiales[0]?.code ?? "",
          id_site: "",
          id_type_equipement: typesEquipement[0]?.id_type_equipement ?? "",
          designation: "",
          marque_modele: "",
          numero_serie: "",
          date_mise_en_service: "",
          statut: "En service",
        },
  );
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [erreurApi, setErreurApi] = useState("");

  const typeActuel = typesEquipement.find(
    (t) => t.id_type_equipement === Number(form.id_type_equipement),
  );
  const sitesDisponibles = sitesDeFiliale(form.codeFiliale);

  function setChamp(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  // Changer de filiale invalide le site choisi (les sites sont propres à une filiale).
  function setFiliale(codeFiliale) {
    setForm((f) => ({ ...f, codeFiliale, id_site: "" }));
  }

  function valider() {
    const e = {};
    if (!form.designation.trim()) e.designation = "Champ obligatoire.";
    if (form.designation.length > 100)
      e.designation = "100 caractères maximum.";
    if (!form.numero_serie.trim()) e.numero_serie = "Champ obligatoire.";
    if (!form.date_mise_en_service)
      e.date_mise_en_service = "Champ obligatoire.";
    if (!form.id_type_equipement)
      e.id_type_equipement = "Choisissez un type d'équipement.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!valider()) return;
    setEnvoi(true);
    setErreurApi("");
    try {
      const donnees = {
        ...form,
        id_site: form.id_site ? Number(form.id_site) : null,
        id_type_equipement: Number(form.id_type_equipement),
      };
      if (existant) {
        await modifierEquipement(existant.id_equipement, donnees);
        navigate(`/equipements/${existant.id_equipement}`);
      } else {
        const cree = await creerEquipement(donnees);
        navigate(`/equipements/${cree.id_equipement}`);
      }
    } catch (e2) {
      setErreurApi(e2.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            {existant ? existant.id_equipement : "Nouvel équipement"}
          </div>
          <h1 style={{ fontSize: "22px" }}>
            {existant ? "Modifier la fiche" : "Créer un équipement"}
          </h1>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 640 }}>
        <Plate style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="field">
                <label htmlFor="filiale">Filiale</label>
                <select
                  id="filiale"
                  value={form.codeFiliale}
                  onChange={(e) => setFiliale(e.target.value)}
                  disabled={!!existant}
                >
                  {filiales.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="site">Site</label>
                <select
                  id="site"
                  value={form.id_site}
                  onChange={(e) => setChamp("id_site", e.target.value)}
                >
                  <option value="">—</option>
                  {sitesDisponibles.map((s) => (
                    <option key={s.id_site} value={s.id_site}>
                      {s.libelle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="type">Type d'équipement</label>
              <select
                id="type"
                value={form.id_type_equipement}
                onChange={(e) =>
                  setChamp("id_type_equipement", e.target.value)
                }
              >
                {typesEquipement.map((t) => (
                  <option
                    key={t.id_type_equipement}
                    value={t.id_type_equipement}
                  >
                    {t.libelle}
                  </option>
                ))}
              </select>
              {erreurs.id_type_equipement && (
                <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                  {erreurs.id_type_equipement}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="designation">
                Désignation (100 caractères max)
              </label>
              <input
                id="designation"
                type="text"
                maxLength={100}
                value={form.designation}
                onChange={(e) => setChamp("designation", e.target.value)}
              />
              {erreurs.designation && (
                <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                  {erreurs.designation}
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="field">
                <label htmlFor="marque">Marque / Modèle</label>
                <input
                  id="marque"
                  type="text"
                  value={form.marque_modele}
                  onChange={(e) => setChamp("marque_modele", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="serie">Numéro de série constructeur</label>
                <input
                  id="serie"
                  type="text"
                  value={form.numero_serie}
                  onChange={(e) => setChamp("numero_serie", e.target.value)}
                />
                {erreurs.numero_serie && (
                  <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                    {erreurs.numero_serie}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="field">
                <label htmlFor="mes">Date de mise en service</label>
                <input
                  id="mes"
                  type="date"
                  value={form.date_mise_en_service}
                  onChange={(e) =>
                    setChamp("date_mise_en_service", e.target.value)
                  }
                />
                {erreurs.date_mise_en_service && (
                  <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                    {erreurs.date_mise_en_service}
                  </span>
                )}
              </div>
              <div className="field">
                <label>Périodicité de contrôle (mois)</label>
                <input
                  type="number"
                  value={typeActuel?.periodicite_mois ?? ""}
                  disabled
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Déterminée selon le type d'équipement.
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="statut">Statut</label>
              <select
                id="statut"
                value={form.statut}
                onChange={(e) => setChamp("statut", e.target.value)}
              >
                {STATUTS_EQUIPEMENT.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginBottom: 18,
              }}
            >
              L'identifiant et le QR code sont générés automatiquement à
              l'enregistrement (§3.1).
            </div>

            {erreurApi && (
              <div
                style={{
                  color: "var(--danger)",
                  fontSize: 12.5,
                  marginBottom: 12,
                }}
              >
                {erreurApi}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={envoi}
              >
                {envoi
                  ? "Enregistrement…"
                  : existant
                    ? "Enregistrer les modifications"
                    : "Créer l'équipement"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                Annuler
              </button>
            </div>
          </form>
        </Plate>
      </div>
    </>
  );
}