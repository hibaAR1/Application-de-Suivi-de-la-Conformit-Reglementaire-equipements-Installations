import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Plate from "../../components/Plate";
import NouveauTypeModal from "../equipements/NouveauTypeModal";
import {
  useEquipements,
  STATUTS_EQUIPEMENT,
} from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";
import { useControlesEngin } from "../../context/ControlesEnginContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { useAuth } from "../../context/AuthContext";

// Un dernier contrôle ne peut être créé automatiquement ici que pour ces deux
// statuts (correspondance directe avec le résultat du contrôle) — "Conforme
// avec réserve" a besoin des détails de la réserve, saisis depuis la fiche.
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

// Formulaire de création / modification d'un ENGIN (table "engin", séparée de
// "equipement"). Même fiche que celle des équipements.
export default function EnginForm() {
  const { ref } = useParams(); // présent = modification, absent = création
  const navigate = useNavigate();
  const { filiales, sitesDeFiliale, typesEquipement } = useEquipements();
  const { getEnginByRef, creerEngin, modifierEngin, rafraichirEngins } =
    useEngins();
  const { ajouterControleEngin } = useControlesEngin();
  const { filialeActive } = useFilialeTheme();
  const { user } = useAuth();

  // IMPORTANT : "existant" doit être déclaré AVANT filialeImposeeParContexte
  // (qui l'utilise), sinon "Cannot access 'existant' before initialization".
  const existant = ref ? getEnginByRef(ref) : null;

  // Un utilisateur rattaché à une (ou plusieurs) filiale(s) précise(s) ne doit
  // pas pouvoir créer un engin pour une AUTRE filiale que la sienne.
  const filialeVerrouillee = !user?.voitToutesFiliales;
  // Quand une filiale précise (pas "Toutes les filiales"/GROUPE) est
  // sélectionnée dans le sidebar à la création, le champ est pré-rempli avec
  // elle et grisé, pour ne pas créer un engin dans la mauvaise filiale.
  const filialeImposeeParContexte =
    !existant && !!filialeActive && filialeActive !== "GROUPE";
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
  // Conforme/Non conforme ; "avec réserve" se fait depuis la fiche de l'engin.
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

  // Filet de sécurité : si la page se charge avant que "filiales" soit arrivé
  // du serveur, la valeur initiale est vide ; on resynchronise dès que la
  // liste arrive.
  useEffect(() => {
    if (!existant && !form.codeFiliale && filiales.length > 0) {
      setFiliale(
        filialeActive && filialeActive !== "GROUPE"
          ? filialeActive
          : filiales[0].code,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filiales]);

  // Si la filiale active du sidebar change PENDANT que ce formulaire de
  // création est ouvert, le champ (grisé) doit suivre ce changement.
  useEffect(() => {
    if (filialeImposeeParContexte && form.codeFiliale !== filialeActive) {
      setFiliale(filialeActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filialeActive, filialeImposeeParContexte]);

  // Choix d'un type : pré-remplit aussi la périodicité avec celle du type
  // (ou 12 par défaut) — modifiable ensuite librement.
  function choisirType(idType) {
    const type = typesEquipement.find(
      (t) => t.id_type_equipement === Number(idType),
    );
    setForm((f) => ({
      ...f,
      id_type_equipement: idType,
      periodicite_mois: type?.periodicite_controle ?? 12,
    }));
  }

  // Appelé quand la popup "+ Nouveau type" a créé le type : on le sélectionne.
  function surNouveauType(type) {
    setForm((f) => ({
      ...f,
      id_type_equipement: type.id_type_equipement,
      periodicite_mois: type.periodicite_controle ?? 12,
    }));
  }

  function valider() {
    const e = {};
    if (!form.codeFiliale) e.codeFiliale = "Choisissez une filiale.";
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
    // est rempli, l'enregistrement du contrôle serait silencieusement ignoré.
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
      let idEnginCible;
      if (existant) {
        await modifierEngin(existant.id_engin, donnees);
        idEnginCible = existant.id_engin;
      } else {
        const cree = await creerEngin(donnees);
        idEnginCible = cree.id_engin;
      }

      // Saisie rapide du dernier contrôle en même temps que la fiche, si
      // remplie (facultatif — les contrôles restent gérables depuis la fiche).
      if (
        form.date_dernier_controle &&
        form.organisme_controle &&
        controleRapidePossible
      ) {
        await ajouterControleEngin({
          enginRef: idEnginCible,
          dateControle: form.date_dernier_controle,
          organisme: form.organisme_controle,
          resultat: RESULTAT_PAR_STATUT[form.statut],
        });
        // La fiche (liste, détail...) lit engin.controles, chargé à part dans
        // EnginsContext : sans ce rechargement, le contrôle qu'on vient de
        // créer n'apparaît pas tant que la page n'est pas rafraîchie.
        await rafraichirEngins();
      }

      navigate("/engins-mobiles");
    } catch (e2) {
      setErreurApi(e2.message);
    } finally {
      setEnvoi(false);
    }
  }

  // Page de modification ouverte avant que la liste des engins soit chargée
  // (ou référence inconnue) : on évite d'afficher un formulaire vide.
  if (ref && !existant) {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="eyebrow">{ref}</div>
            <h1 style={{ fontSize: "22px" }}>Modifier l'engin</h1>
          </div>
        </div>
        <div className="content" style={{ maxWidth: 640 }}>
          <Plate style={{ padding: 24 }}>
            <p style={{ color: "var(--text-muted)" }}>
              Engin introuvable (ou chargement en cours…).
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/engins-mobiles")}
            >
              Retour à la liste
            </button>
          </Plate>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            {existant ? existant.id_engin : "Nouvel engin"}
          </div>
          <h1 style={{ fontSize: "22px" }}>
            {existant ? "Modifier l'engin" : "Créer un engin"}
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
                  disabled={
                    !!existant ||
                    filialeVerrouillee ||
                    filialeImposeeParContexte
                  }
                >
                  {filiales.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.code}
                    </option>
                  ))}
                </select>
                {!existant && filialeImposeeParContexte && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Filiale imposée par la sélection actuelle du sidebar.
                  </div>
                )}
                {erreurs.codeFiliale && (
                  <span style={{ color: "var(--danger)", fontSize: 11.5 }}>
                    {erreurs.codeFiliale}
                  </span>
                )}
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
                Type d'engin <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  id="type"
                  style={{ flex: 1 }}
                  value={form.id_type_equipement}
                  onChange={(e) => choisirType(e.target.value)}
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
                  title="Créer un nouveau type"
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
                réserve depuis la fiche de l'engin après la création.
              </p>
            )}

            {erreurApi && (
              <div
                style={{
                  color: "var(--danger)",
                  fontSize: 12.5,
                  margin: "12px 0",
                }}
              >
                {erreurApi}
              </div>
            )}

            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                margin: "16px 0 10px",
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
                    : "Créer l'engin"}
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
