import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import { apiFetch } from "../utils/api";
import { useControles } from "../context/ControlesContext";

// §3.2 du CDC — champs "Justificatif de levée" (PDF/image) et "Date de levée
// effective". Valider ce formulaire fait passer la réserve au statut "Levée".
export default function ReserveForm() {
  const { id } = useParams(); // id_reserve
  const navigate = useNavigate();
  const { leverReserve } = useControles();
  const [reserve, setReserve] = useState(null);
  const [chargement, setChargement] = useState(true);

  const [dateEffective, setDateEffective] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fichier, setFichier] = useState(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    apiFetch(`/reserves/${id}`)
      .then(setReserve)
      .catch(() => setReserve(null))
      .finally(() => setChargement(false));
  }, [id]);

  if (chargement) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>Chargement...</Plate>
      </div>
    );
  }

  if (!reserve) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>Réserve introuvable.</Plate>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fichier) {
      setErreur("Le justificatif de levée est obligatoire (PDF ou image).");
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      await leverReserve(reserve.id_reserve, {
        justificatifNom: fichier.name,
        dateLeveeEffective: dateEffective,
      });
      navigate(`/equipements/${reserve.controle?.id_equipement ?? ""}`);
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
          <div className="eyebrow">Réserve #{reserve.id_reserve}</div>
          <h1 style={{ fontSize: "22px" }}>Lever la réserve</h1>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 520 }}>
        <Plate style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <Badge tone="warning">{reserve.niveau_criticite}</Badge>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              {reserve.nature_reserve}
            </div>
            <div className="spec-label" style={{ marginTop: 10 }}>
              Délai réglementaire
            </div>
            <div className="mono" style={{ fontWeight: 600 }}>
              {reserve.delai_levee}
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
