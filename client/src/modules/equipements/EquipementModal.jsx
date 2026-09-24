import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge";
import { useEquipements } from "../../context/EquipementsContext";

const STATUT_TONE = {
  Conforme: "success",
  "Conforme avec réserve": "warning",
  "Non conforme": "danger",
};
const RESERVE_STATUT_TONE = {
  Ouverte: "warning",
  "En cours": "warning",
  Levée: "success",
  "En retard": "danger",
};

const ONGLETS = [
  "Informations",
  "Rapports",
  "Réserves",
  "Caractéristiques",
  "Assistant IA",
];

function dernierControle(eq) {
  if (!eq.controles?.length) return null;
  return [...eq.controles].sort(
    (a, b) => new Date(b.date_controle) - new Date(a.date_controle),
  )[0];
}

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,13,11,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 20,
};

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  width: "100%",
  maxWidth: 760,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "var(--shadow)",
};

// Fiche équipement détaillée, ouverte en fenêtre par-dessus la liste (bouton
// "Ouvrir"). Reprend la maquette : bandeau résumé + onglets Informations /
// Rapports / Réserves / Caractéristiques / Assistant IA.
export default function EquipementModal({ id, onClose }) {
  const {
    getByRef,
    modifierDetailsEquipement,
    recupererRapports,
    ajouterRapport,
    genererAssistant,
  } = useEquipements();
  const navigate = useNavigate();
  const eq = getByRef(id);
  const [onglet, setOnglet] = useState("Informations");
  const [rapports, setRapports] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!eq) return;
    recupererRapports(eq.id_equipement)
      .then(setRapports)
      .catch(() => setRapports([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eq?.id_equipement]);

  if (!eq) return null;

  const dernier = dernierControle(eq);
  const reserves = (eq.controles ?? []).flatMap((c) =>
    (c.reserves ?? []).map((r) => ({ ...r, controle: c })),
  );
  const reservesOuvertes = reserves.filter((r) => r.statut !== "Levée").length;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "20px 24px 0",
          }}
        >
          <h2 style={{ fontSize: 18 }}>
            {eq.id_equipement} — {eq.designation}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "4px 10px" }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "12px 24px 24px" }}>
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Badge
                tone={
                  eq.type_equipement?.categorie === "Mobile"
                    ? "warning"
                    : "success"
                }
              >
                {(eq.type_equipement?.categorie ?? "—").toUpperCase()}
              </Badge>
              <Badge tone={STATUT_TONE[eq.statut] ?? "success"}>
                {eq.statut}
              </Badge>
            </div>
            <div style={{ fontSize: 13.5 }}>
              <strong>Filiale :</strong> {eq.filiale?.libelle ?? "—"}
              {eq.site && (
                <>
                  {" "}
                  | <strong>Site :</strong> {eq.site.libelle}
                </>
              )}
            </div>
            <div style={{ fontSize: 13.5 }}>
              <strong>Type :</strong> {eq.type_equipement?.libelle ?? "—"}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}
            >
              Dernier contrôle :{" "}
              {dernier ? formaterDate(dernier.date_controle) : "—"}{" "}
              &nbsp;|&nbsp; Réserves ouvertes :{" "}
              <strong>{reservesOuvertes}</strong>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              borderBottom: "1px solid var(--border)",
              margin: "16px 0",
              overflowX: "auto",
            }}
          >
            {ONGLETS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOnglet(o)}
                style={{
                  padding: "8px 2px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    onglet === o
                      ? "2px solid var(--bordeaux)"
                      : "2px solid transparent",
                  fontWeight: 600,
                  fontSize: 13,
                  color: onglet === o ? "var(--bordeaux)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {o}
                {o === "Rapports" && rapports ? ` (${rapports.length})` : ""}
                {o === "Réserves" ? ` (${reserves.length})` : ""}
              </button>
            ))}
          </div>

          {onglet === "Informations" && (
            <OngletInformations
              eq={eq}
              dernier={dernier}
              onSave={modifierDetailsEquipement}
            />
          )}
          {onglet === "Rapports" && (
            <OngletRapports
              eq={eq}
              rapports={rapports}
              setRapports={setRapports}
              ajouterRapport={ajouterRapport}
            />
          )}
          {onglet === "Réserves" && (
            <OngletReserves
              reserves={reserves}
              navigate={navigate}
              onClose={onClose}
            />
          )}
          {onglet === "Caractéristiques" && (
            <OngletCaracteristiques
              eq={eq}
              onSave={modifierDetailsEquipement}
            />
          )}
          {onglet === "Assistant IA" && (
            <OngletAssistant eq={eq} genererAssistant={genererAssistant} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBloc({ label, valeur }) {
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <div className="spec-label">{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>
        {valeur}
      </div>
    </div>
  );
}

function ChampTexte({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function OngletInformations({ eq, dernier, onSave }) {
  const [form, setForm] = useState({
    fabricant: eq.fabricant ?? "",
    modele: eq.modele ?? "",
    numero_serie: eq.numero_serie ?? "",
    immatriculation: eq.immatriculation ?? "",
    annee_fabrication: eq.annee_fabrication ?? "",
    organisme_controle: eq.organisme_controle ?? "",
  });
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState("");

  async function enregistrer() {
    setEnregistrement(true);
    setMessage("");
    try {
      await onSave(eq.id_equipement, {
        ...form,
        annee_fabrication: form.annee_fabrication
          ? Number(form.annee_fabrication)
          : null,
      });
      setMessage("Enregistré.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <InfoBloc label="Identifiant" valeur={eq.id_equipement} />
        <InfoBloc label="Filiale" valeur={eq.filiale?.libelle ?? "—"} />
        <InfoBloc label="Site" valeur={eq.site?.libelle ?? "—"} />
        <InfoBloc label="Type" valeur={eq.type_equipement?.libelle ?? "—"} />
        <InfoBloc
          label="Groupe"
          valeur={eq.type_equipement?.categorie ?? "—"}
        />
        <InfoBloc
          label="Périodicité"
          valeur={
            eq.type_equipement?.periodicite_controle
              ? `${eq.type_equipement.periodicite_controle} mois`
              : "—"
          }
        />
        <InfoBloc
          label="Dernier contrôle"
          valeur={
            dernier ? formaterDate(dernier.date_controle) : "Non effectué"
          }
        />
        <InfoBloc
          label="Prochain contrôle"
          valeur={
            dernier?.prochaine_echeance
              ? formaterDate(dernier.prochaine_echeance)
              : "Non renseigné"
          }
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ChampTexte
          label="Fabricant"
          placeholder="ex: Caterpillar, Liebherr..."
          value={form.fabricant}
          onChange={(v) => setForm((f) => ({ ...f, fabricant: v }))}
        />
        <ChampTexte
          label="Modèle"
          placeholder="ex: 320D, R480"
          value={form.modele}
          onChange={(v) => setForm((f) => ({ ...f, modele: v }))}
        />
        <ChampTexte
          label="N° série"
          placeholder="Numéro de série constructeur"
          value={form.numero_serie}
          onChange={(v) => setForm((f) => ({ ...f, numero_serie: v }))}
        />
        <ChampTexte
          label="Immatriculation"
          placeholder="ex: 1234-A-25"
          value={form.immatriculation}
          onChange={(v) => setForm((f) => ({ ...f, immatriculation: v }))}
        />
        <ChampTexte
          label="Année fabrication"
          type="number"
          placeholder="ex: 2019"
          value={form.annee_fabrication}
          onChange={(v) => setForm((f) => ({ ...f, annee_fabrication: v }))}
        />
        <ChampTexte
          label="Organisme de contrôle"
          placeholder="ex: SOCOTEC, VERITAS, APAVE..."
          value={form.organisme_controle}
          onChange={(v) => setForm((f) => ({ ...f, organisme_controle: v }))}
        />
      </div>

      {message && (
        <div
          style={{
            fontSize: 12.5,
            color:
              message === "Enregistré." ? "var(--success)" : "var(--danger)",
            marginTop: 8,
          }}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        onClick={enregistrer}
        disabled={enregistrement}
      >
        {enregistrement ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

function OngletCaracteristiques({ eq, onSave }) {
  const definition = eq.type_equipement?.caracteristiques_definition ?? [];
  const [valeurs, setValeurs] = useState(() => ({
    ...(eq.caracteristiques ?? {}),
  }));
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState("");

  if (definition.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
        Le type « {eq.type_equipement?.libelle ?? "—"} » n'a pas de
        caractéristiques définies. Tu peux en ajouter en créant un type depuis
        le formulaire d'équipement (bouton "+" à côté de Type).
      </p>
    );
  }

  async function enregistrer() {
    setEnregistrement(true);
    setMessage("");
    try {
      await onSave(eq.id_equipement, { caracteristiques: valeurs });
      setMessage("Enregistré.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div>
      <p
        style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}
      >
        Caractéristiques techniques spécifiques à l'équipement
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {definition.map((c) => (
          <ChampTexte
            key={c.cle}
            label={c.libelle}
            value={valeurs[c.cle] ?? ""}
            onChange={(v) => setValeurs((val) => ({ ...val, [c.cle]: v }))}
          />
        ))}
      </div>
      {message && (
        <div
          style={{
            fontSize: 12.5,
            color:
              message === "Enregistré." ? "var(--success)" : "var(--danger)",
            marginTop: 8,
          }}
        >
          {message}
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 8 }}
        onClick={enregistrer}
        disabled={enregistrement}
      >
        {enregistrement ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

function OngletRapports({ eq, rapports, setRapports, ajouterRapport }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [form, setForm] = useState({
    dateRapport: "",
    organisme: "",
    reference: "",
    constatations: "",
    fichier: null,
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const cree = await ajouterRapport(eq.id_equipement, form);
      setRapports((prev) => [cree, ...(prev ?? [])]);
      setForm({
        dateRapport: "",
        organisme: "",
        reference: "",
        constatations: "",
        fichier: null,
      });
      setFormulaireOuvert(false);
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div>
      {rapports === null ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement…</p>
      ) : rapports.length === 0 ? (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          Aucun rapport enregistré
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {rapports.map((r) => (
            <div
              key={r.id_rapport}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <strong>{r.organisme}</strong>
                <span
                  className="mono"
                  style={{ fontSize: 12, color: "var(--text-muted)" }}
                >
                  {formaterDate(r.date_rapport)}
                </span>
              </div>
              {r.reference && (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Réf : {r.reference}
                </div>
              )}
              {r.constatations && (
                <div style={{ fontSize: 12.5, marginTop: 4 }}>
                  {r.constatations}
                </div>
              )}
              {r.chemin_pdf && (
                <a
                  href={`http://127.0.0.1:8000/storage/${r.chemin_pdf}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12,
                    color: "var(--bordeaux)",
                    fontWeight: 600,
                  }}
                >
                  Voir le PDF
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {!formulaireOuvert ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setFormulaireOuvert(true)}
        >
          + Ajouter un rapport
        </button>
      ) : (
        <form
          onSubmit={envoyer}
          style={{
            border: "1px dashed var(--border)",
            borderRadius: 8,
            padding: 14,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date *</label>
              <input
                type="date"
                required
                value={form.dateRapport}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateRapport: e.target.value }))
                }
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Organisme *</label>
              <input
                type="text"
                required
                placeholder="SOCOTEC, VERITAS..."
                value={form.organisme}
                onChange={(e) =>
                  setForm((f) => ({ ...f, organisme: e.target.value }))
                }
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Référence</label>
              <input
                type="text"
                placeholder="VT-2024-1234"
                value={form.reference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reference: e.target.value }))
                }
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Rapport PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fichier: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
            <label>Constatations</label>
            <textarea
              rows={3}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid var(--border)",
                borderRadius: 5,
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: 13.5,
              }}
              value={form.constatations}
              onChange={(e) =>
                setForm((f) => ({ ...f, constatations: e.target.value }))
              }
            />
          </div>
          {erreur && (
            <div
              style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}
            >
              {erreur}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={envoi}>
              {envoi ? "Envoi…" : "Enregistrer"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setFormulaireOuvert(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function OngletReserves({ reserves, navigate, onClose }) {
  if (reserves.length === 0) {
    return (
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: 13,
          textAlign: "center",
          padding: "16px 0",
        }}
      >
        Aucune réserve enregistrée pour cet équipement.
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {reserves.map((r) => (
        <div
          key={r.id_reserve}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <Badge tone={RESERVE_STATUT_TONE[r.statut] ?? "warning"}>
              {r.statut}
            </Badge>
            <Badge
              tone={
                r.niveau_criticite === "Bloquante"
                  ? "danger"
                  : r.niveau_criticite === "Majeure"
                    ? "warning"
                    : "success"
              }
            >
              {r.niveau_criticite}
            </Badge>
          </div>
          <div style={{ fontSize: 13.5 }}>{r.nature_reserve}</div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
          >
            Délai réglementaire : {formaterDate(r.delai_levee)}
          </div>
          {r.statut !== "Levée" && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 10, padding: "6px 12px", fontSize: 12.5 }}
              onClick={() => {
                onClose();
                navigate(`/reserves/${r.id_reserve}/lever`);
              }}
            >
              Clôturer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function OngletAssistant({ eq, genererAssistant }) {
  const [enCours, setEnCours] = useState(null);
  const [resultat, setResultat] = useState("");
  const [erreur, setErreur] = useState("");

  async function generer(cible) {
    setEnCours(cible);
    setErreur("");
    setResultat("");
    try {
      const texte = await genererAssistant(eq.id_equipement, cible);
      setResultat(texte);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
        ✦ Assistant IA
      </div>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          disabled={enCours !== null}
          onClick={() => generer("plan-action")}
        >
          {enCours === "plan-action" ? "Génération…" : "Plan d'action"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={enCours !== null}
          onClick={() => generer("points-controle")}
        >
          {enCours === "points-controle" ? "Génération…" : "Points de contrôle"}
        </button>
      </div>
      {erreur && (
        <div
          style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 10 }}
        >
          {erreur}
        </div>
      )}
      {resultat && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 14,
            whiteSpace: "pre-line",
            fontSize: 13.5,
          }}
        >
          {resultat}
        </div>
      )}
    </div>
  );
}
