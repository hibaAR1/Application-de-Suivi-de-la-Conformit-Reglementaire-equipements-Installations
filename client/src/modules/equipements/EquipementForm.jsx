import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Plate from "../../components/Plate";
import NouveauTypeModal from "./NouveauTypeModal";
import {
  useEquipements,
  STATUTS_EQUIPEMENT,
} from "../../context/EquipementsContext";
import { useControles } from "../../context/ControlesContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";

// Un dernier contrôle ne peut être créé automatiquement ici que pour ces deux
// statuts (correspondance directe avec le résultat du contrôle) — "Conforme
// avec réserve" a besoin des détails de la réserve, saisis depuis Contrôles.
const RESULTAT_PAR_STATUT = {
  Conforme: "Favorable",
  "Non conforme": "Défavorable",
};

function calculerProchaineEcheance(dateControle, periodiciteMois) {
  if (!dateControle || !periodiciteMois) return null;
  const d = new Date(dateControle);
  d.setMonth(d.getMonth() + Number(periodiciteMois));
  return d.toISOString().slice(0, 10);
}

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
    rafraichirEquipements,
  } = useEquipements();
  const { ajouterControle } = useControles();
  const { filialeActive } = useFilialeTheme();
  const existant = ref ? getByRef(ref) : null;
  const dernierControleExistant = existant?.controles?.length
    ? [...existant.controles].sort(
        (a, b) => new Date(b.date_controle) - new Date(a.date_controle),
      )[0]
    : null;

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
          periodicite_mois: existant.periodicite_mois ?? "",
          statut: existant.statut ?? "Conforme",
          fabricant: existant.fabricant ?? "",
          modele: existant.modele ?? "",
          annee_fabrication: existant.annee_fabrication ?? "",
          organisme_controle: existant.organisme_controle ?? "",
          date_dernier_controle: "",
        }
      : {
          codeFiliale:
            filialeActive && filialeActive !== "GROUPE"
              ? filialeActive
              : (filiales[0]?.code ?? ""),
          id_site: "",
          id_type_equipement: "",
          designation: "",
          marque_modele: "",
          numero_serie: "",
          date_mise_en_service: "",
          periodicite_mois: "",
          statut: "Conforme",
          fabricant: "",
          modele: "",
          annee_fabrication: "",
          organisme_controle: "",
          date_dernier_controle: "",
        },
  );
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [erreurApi, setErreurApi] = useState("");
  const [nouveauTypeOuvert, setNouveauTypeOuvert] = useState(false);

  const typeActuel = typesEquipement.find(
    (t) => t.id_type_equipement === Number(form.id_type_equipement),
  );
  const sitesDisponibles = sitesDeFiliale(form.codeFiliale);
  // Le contrôle rapide (statut → résultat direct) n'est proposé que pour
  // Conforme/Non conforme ; "avec réserve" se fait depuis la page Contrôles.
  const controleRapidePossible = form.statut in RESULTAT_PAR_STATUT;
  const prochaineEcheancePrevue = calculerProchaineEcheance(
    form.date_dernier_controle,
    form.periodicite_mois,
  );

  function setChamp(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  // Changer de filiale invalide le site choisi (les sites sont propres à une filiale).
  function setFiliale(codeFiliale) {
    setForm((f) => ({ ...f, codeFiliale, id_site: "" }));
  }

  // Appelé quand la popup "+ Nouveau type" a créé le type : on le sélectionne
  // directement dans le <select> Type de ce formulaire.
  function surNouveauType(type) {
    setChamp("id_type_equipement", type.id_type_equipement);
  }

  function valider() {
    const e = {};
    if (!form.designation.trim()) e.designation = "Champ obligatoire.";
    if (form.designation.length > 100)
      e.designation = "100 caractères maximum.";
    if (!form.numero_serie.trim()) e.numero_serie = "Champ obligatoire.";
    if (!form.date_mise_en_service)
      e.date_mise_en_service = "Champ obligatoire.";
    if (!form.periodicite_mois || Number(form.periodicite_mois) < 1)
      e.periodicite_mois = "Champ obligatoire.";
    if (!form.id_type_equipement)
      e.id_type_equipement = "Choisissez un type d'équipement.";
    // Les deux champs du contrôle rapide vont ensemble : si un seul des deux
    // est rempli, l'enregistrement du contrôle serait silencieusement ignoré
    // (voir handleSubmit) — on le signale ici clairement au lieu de laisser
    // l'utilisateur croire que ça a marché.
    if (
      controleRapidePossible &&
      form.date_dernier_controle &&
      !form.organisme_controle.trim()
    ) {
      e.date_dernier_controle =
        "Renseignez aussi l'organisme de contrôle ci-dessus pour enregistrer ce contrôle.";
    }
    if (
      controleRapidePossible &&
      !form.date_dernier_controle &&
      form.organisme_controle.trim() &&
      !existant?.organisme_controle
    ) {
      e.date_dernier_controle =
        "Renseignez aussi la date du dernier contrôle pour enregistrer ce contrôle.";
    }
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
        periodicite_mois: Number(form.periodicite_mois),
        annee_fabrication: form.annee_fabrication
          ? Number(form.annee_fabrication)
          : null,
      };
      let idEquipementCible;
      if (existant) {
        await modifierEquipement(existant.id_equipement, donnees);
        idEquipementCible = existant.id_equipement;
      } else {
        const cree = await creerEquipement(donnees);
        idEquipementCible = cree.id_equipement;
      }

      // Saisie rapide du dernier contrôle en même temps que la fiche, si
      // remplie (facultatif — les contrôles restent gérables depuis Contrôles).
      if (
        form.date_dernier_controle &&
        form.organisme_controle &&
        controleRapidePossible
      ) {
        await ajouterControle({
          equipementRef: idEquipementCible,
          dateControle: form.date_dernier_controle,
          organisme: form.organisme_controle,
          resultat: RESULTAT_PAR_STATUT[form.statut],
        });
        // La fiche équipement (liste, fiche technique...) lit eq.controles,
        // une relation chargée à part dans EquipementsContext : sans ce
        // rechargement, le contrôle qu'on vient de créer n'apparaît pas
        // tant que la page n'est pas rafraîchie manuellement.
        await rafraichirEquipements();
      }

      navigate("/equipements");
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
              <label htmlFor="type">
                Type d'équipement{" "}
                <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  id="type"
                  style={{ flex: 1 }}
                  value={form.id_type_equipement}
                  onChange={(e) =>
                    setChamp("id_type_equipement", e.target.value)
                  }
                >
                  <option value="">—</option>
                  {typesEquipement.map((t) => (
                    <option
                      key={t.id_type_equipement}
                      value={t.id_type_equipement}
                    >
                      {t.libelle}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  title="Créer un nouveau type d'équipement"
                  onClick={() => setNouveauTypeOuvert(true)}
                >
                  +
                </button>
              </div>
              {erreurs.id_type_equipement && (
                <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                  {erreurs.id_type_equipement}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="designation">
                Désignation (100 caractères max){" "}
                <span style={{ color: "var(--danger)" }}>*</span>
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
                <label htmlFor="serie">
                  Numéro de série constructeur{" "}
                  <span style={{ color: "var(--danger)" }}>*</span>
                </label>
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
                <label htmlFor="mes">
                  Date de mise en service{" "}
                  <span style={{ color: "var(--danger)" }}>*</span>
                </label>
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
                <label htmlFor="periodicite">
                  Périodicité de contrôle (mois){" "}
                  <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="periodicite"
                  type="number"
                  min={1}
                  placeholder={
                    typeActuel?.periodicite_controle
                      ? `ex: ${typeActuel.periodicite_controle}`
                      : "ex: 12"
                  }
                  value={form.periodicite_mois}
                  onChange={(e) => setChamp("periodicite_mois", e.target.value)}
                />
                {erreurs.periodicite_mois && (
                  <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                    {erreurs.periodicite_mois}
                  </span>
                )}
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
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "20px 0 8px",
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
              }}
            >
              Informations complémentaires
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="field">
                <label htmlFor="fabricant">Fabricant</label>
                <input
                  id="fabricant"
                  type="text"
                  value={form.fabricant}
                  onChange={(e) => setChamp("fabricant", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="modele">Modèle</label>
                <input
                  id="modele"
                  type="text"
                  value={form.modele}
                  onChange={(e) => setChamp("modele", e.target.value)}
                />
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
                <label htmlFor="annee">Année de fabrication</label>
                <input
                  id="annee"
                  type="number"
                  min={1950}
                  max={2100}
                  value={form.annee_fabrication}
                  onChange={(e) =>
                    setChamp("annee_fabrication", e.target.value)
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="organisme">Organisme de contrôle</label>
                <input
                  id="organisme"
                  type="text"
                  value={form.organisme_controle}
                  onChange={(e) =>
                    setChamp("organisme_controle", e.target.value)
                  }
                />
              </div>
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "20px 0 8px",
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
              }}
            >
              Dernier contrôle{" "}
              {dernierControleExistant &&
                `(actuel : ${dernierControleExistant.date_controle})`}
            </div>

            {controleRapidePossible ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div className="field">
                  <label htmlFor="dernier-controle">
                    Date du dernier contrôle
                  </label>
                  <input
                    id="dernier-controle"
                    type="date"
                    value={form.date_dernier_controle}
                    onChange={(e) =>
                      setChamp("date_dernier_controle", e.target.value)
                    }
                  />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Facultatif — renseigner aussi l'organisme ci-dessus pour
                    l'enregistrer.
                  </span>
                  {erreurs.date_dernier_controle && (
                    <span
                      style={{
                        display: "block",
                        color: "var(--danger)",
                        fontSize: 11.5,
                      }}
                    >
                      {erreurs.date_dernier_controle}
                    </span>
                  )}
                </div>
                <div className="field">
                  <label>Prochaine échéance (calculée)</label>
                  <input
                    type="text"
                    value={prochaineEcheancePrevue ?? ""}
                    disabled
                  />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Date du contrôle + périodicité saisie ci-dessus.
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Pour "Conforme avec réserve", saisissez le contrôle et la
                réserve depuis la page Contrôles après la création.
              </p>
            )}

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

            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              <span style={{ color: "var(--danger)" }}>*</span> champs
              obligatoires
            </p>

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

      {nouveauTypeOuvert && (
        <NouveauTypeModal
          onClose={() => setNouveauTypeOuvert(false)}
          onCree={surNouveauType}
        />
      )}
    </>
  );
}
