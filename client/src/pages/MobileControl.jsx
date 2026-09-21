import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEquipements } from "../context/EquipementsContext";
import {
  useControles,
  RESULTATS_CONTROLE,
  NIVEAUX_CRITICITE,
} from "../context/ControlesContext";

// §3.2 du CDC : "Saisie contrôle/réserve via scan QR code" (Technicien terrain).
// Branché sur les deux vrais magasins API : lit la périodicité de l'équipement
// scanné (via son type) pour calculer la prochaine échéance, et enregistre
// réellement le contrôle (+ réserve éventuelle) en base.
export default function MobileControl() {
  const { id: ref } = useParams();
  const navigate = useNavigate();
  const { getByRef, chargement: chargementEquipements } = useEquipements();
  const { ajouterControle } = useControles();
  const equipement = getByRef(ref);

  const [dateControle, setDateControle] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [organisme, setOrganisme] = useState("SGS Maroc");
  const [resultat, setResultat] = useState("Favorable");
  const [natureReserve, setNatureReserve] = useState("");
  const [criticite, setCriticite] = useState(NIVEAUX_CRITICITE[1]);
  const [rapport, setRapport] = useState(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [confirme, setConfirme] = useState(null);

  if (chargementEquipements && !equipement) {
    return (
      <div
        style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}
      >
        Chargement...
      </div>
    );
  }

  if (!equipement) {
    return (
      <div
        style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}
      >
        Équipement "{ref}" introuvable dans le référentiel.
      </div>
    );
  }

  const periodicite = equipement.type_equipement?.periodicite_mois;

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    if (!rapport) {
      setErreur("Le rapport de contrôle (PDF) est obligatoire.");
      return;
    }
    if (resultat === "Favorable avec réserves" && !natureReserve.trim()) {
      setErreur("Merci de préciser la nature de la réserve.");
      return;
    }
    setEnvoi(true);
    try {
      const nouveau = await ajouterControle({
        id_equipement: equipement.id_equipement,
        dateControle,
        organisme,
        resultat,
        rapportNom: rapport.name,
        periodiciteEquipement: periodicite,
        reserveInfo:
          resultat === "Favorable avec réserves"
            ? { nature: natureReserve, criticite }
            : null,
      });
      setConfirme(nouveau);
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoi(false);
    }
  }

  if (confirme) {
    const reserve = (confirme.reserves ?? [])[0];
    return (
      <div style={{ padding: "20px 0 40px" }}>
        <div className="mobile-frame">
          <div
            className="mobile-content"
            style={{ textAlign: "center", padding: "40px 24px" }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 17, marginBottom: 8 }}>
              Contrôle enregistré
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              {equipement.designation}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              Prochaine échéance :{" "}
              <span className="mono">{confirme.prochaine_echeance}</span>
            </p>
            {reserve && (
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--warning)",
                  marginTop: 8,
                }}
              >
                Réserve ouverte — délai de levée : {reserve.delai_levee}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 24 }}
              onClick={() => navigate("/")}
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 0 40px" }}>
      <div className="mobile-frame">
        <div className="mobile-topbar">
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              fontFamily: "'IBM Plex Mono',monospace",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Équipement scanné
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {equipement.designation}
          </div>
          <div className="ref" style={{ color: "rgba(239,233,223,0.55)" }}>
            {equipement.id_equipement} · périodicité {periodicite ?? "—"} mois
          </div>
        </div>
        <form className="mobile-content" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="date-controle">Date du contrôle</label>
            <input
              id="date-controle"
              type="date"
              value={dateControle}
              onChange={(e) => setDateControle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="organisme">Organisme de contrôle</label>
            <select
              id="organisme"
              value={organisme}
              onChange={(e) => setOrganisme(e.target.value)}
            >
              <option>SGS Maroc</option>
              <option>Bureau Véritas</option>
              <option>Apave</option>
            </select>
          </div>
          <div className="field">
            <label>Résultat global</label>
            <div className="segmented">
              {RESULTATS_CONTROLE.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={
                    resultat === r
                      ? r === "Favorable"
                        ? "sel-fav"
                        : r === "Défavorable"
                          ? "sel-def"
                          : "sel-res"
                      : ""
                  }
                  onClick={() => setResultat(r)}
                >
                  {r === "Favorable avec réserves" ? "Avec réserves" : r}
                </button>
              ))}
            </div>
          </div>
          {resultat === "Favorable avec réserves" && (
            <>
              <div className="field">
                <label htmlFor="nature">Nature de la réserve</label>
                <input
                  id="nature"
                  type="text"
                  value={natureReserve}
                  onChange={(e) => setNatureReserve(e.target.value)}
                  placeholder="Ex. : étiquetage manquant"
                />
              </div>
              <div className="field">
                <label htmlFor="criticite">Niveau de criticité</label>
                <select
                  id="criticite"
                  value={criticite}
                  onChange={(e) => setCriticite(e.target.value)}
                >
                  {NIVEAUX_CRITICITE.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="rapport">
              Rapport de contrôle (PDF, 10 Mo max)
            </label>
            <input
              id="rapport"
              type="file"
              accept="application/pdf"
              onChange={(e) => setRapport(e.target.files?.[0] ?? null)}
            />
            {rapport && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {rapport.name}
              </div>
            )}
          </div>

          {erreur && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: 12.5,
                marginBottom: 12,
              }}
            >
              {erreur}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 6 }}
            disabled={envoi}
          >
            {envoi ? "Enregistrement…" : "Enregistrer le contrôle"}
          </button>
        </form>
      </div>
    </div>
  );
}
