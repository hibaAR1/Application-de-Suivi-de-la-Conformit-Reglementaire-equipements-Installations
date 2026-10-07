import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import { useControlesEngin } from "../../context/ControlesEnginContext";
import { useEngins } from "../../context/EnginsContext";

// Lever une réserve d'ENGIN (table "reserve_engin") : "Justificatif de levée"
// (PDF/image) + "Date de levée effective". Valider ce formulaire fait passer
// la réserve au statut "Clôturée".
export default function ReserveEnginForm() {
  // La route est "/engins-mobiles/reserves/:id/lever" — "id" est l'identifiant
  // de la RÉSERVE (id_reserve_engin), pas celui du contrôle. On retrouve donc
  // le contrôle qui porte cette réserve, via controle.reserve.idReserve.
  const { id } = useParams();
  const navigate = useNavigate();
  const { controles, leverReserveEngin } = useControlesEngin();
  const { rafraichirEngins } = useEngins();
  const controle = controles.find(
    (c) => c.reserve && String(c.reserve.idReserve) === id,
  );
  const [dateEffective, setDateEffective] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fichier, setFichier] = useState(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  if (!controle || !controle.reserve) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>Réserve introuvable.</Plate>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await leverReserveEngin(controle.id, {
        fichier,
        dateLeveeEffective: dateEffective,
      });
      await rafraichirEngins();
      navigate("/engins-mobiles");
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
          <div className="eyebrow">{controle.enginRef}</div>
          <h1 style={{ fontSize: "22px" }}>Lever la réserve</h1>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 520 }}>
        <Plate style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <Badge tone="warning">{controle.reserve.criticite}</Badge>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              {controle.reserve.nature}
            </div>
            <div className="spec-label" style={{ marginTop: 10 }}>
              Délai réglementaire
            </div>
            <div className="mono" style={{ fontWeight: 600 }}>
              {controle.reserve.delaiLevee}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="fichier">
                Justificatif de levée (PDF ou image)
              </label>
              <input
                id="fichier"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              />
              {fichier && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {fichier.name}
                </div>
              )}
            </div>
            <div className="field">
              <label htmlFor="date-effective">Date de levée effective</label>
              <input
                id="date-effective"
                type="date"
                value={dateEffective}
                onChange={(e) => setDateEffective(e.target.value)}
              />
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

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={envoi}
              >
                {envoi ? "Envoi…" : "Confirmer la levée"}
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
