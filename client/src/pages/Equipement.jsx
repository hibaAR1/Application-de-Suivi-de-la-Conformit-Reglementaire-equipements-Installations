import { useParams, useNavigate } from "react-router-dom";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import QRVisual from "../components/QRVisual";
import { IconChevron } from "../components/icons";
import { useEquipements } from "../context/EquipementsContext";
import { useControles } from "../context/ControlesContext";

const CRITICITE_TONE = {
  Mineure: "success",
  Majeure: "warning",
  Bloquante: "danger",
};
const RESERVE_STATUT_TONE = {
  Ouverte: "warning",
  "En cours": "warning",
  Levée: "success",
  "En retard": "danger",
};

export default function Equipement() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { getByRef } = useEquipements();
  const { controles = [] } = useControles();

  const eq = getByRef(ref);

  if (!eq) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>Équipement "{ref}" introuvable.</Plate>
      </div>
    );
  }

  const historique = controles
    .filter((c) => c.equipementRef === ref)
    .sort((a, b) => (a.dateControle < b.dateControle ? 1 : -1));

  const reserveActive = historique.find(
    (c) => c.reserve && c.reserve.statut !== "Levée",
  )?.reserve;

  const controleAvecReserveActive = historique.find(
    (c) => c.reserve && c.reserve.statut !== "Levée",
  );

  return (
    <>
      <div className="topbar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "var(--text-muted)",
          }}
        >
          Équipements <IconChevron /> <span className="ref">{eq.ref}</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/equipements/${ref}/modifier`)}
        >
          Modifier la fiche
        </button>
      </div>

      <div className="content">
        <Plate
          style={{
            padding: "24px",
            display: "flex",
            gap: 24,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <QRVisual />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow">{eq.typeEquipement}</div>
            <h2 style={{ fontSize: "21px", marginBottom: 4 }}>
              {eq.designation}
            </h2>
            <div className="ref">{eq.ref}</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ width: 280 }}>
            <div className="spec-row">
              <span className="spec-label">Filiale</span>
              <span>{eq.filiale}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Mise en service</span>
              <span className="mono">{eq.dateMiseEnService}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Périodicité</span>
              <span>{eq.periodiciteControle} mois</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Statut</span>
              <Badge tone="success">{eq.statut}</Badge>
            </div>
          </div>
        </Plate>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 16,
          }}
        >
          <Plate>
            <div className="panel-header">
              <div className="panel-title">Historique des contrôles</div>
            </div>
            {historique.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Aucun contrôle enregistré pour cet équipement.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Organisme</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((h) => (
                    <tr key={h.id}>
                      <td className="mono">{h.dateControle}</td>
                      <td>{h.organisme}</td>
                      <td>
                        <Badge
                          tone={
                            h.resultat === "Favorable"
                              ? "success"
                              : h.resultat === "Défavorable"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {h.resultat}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Plate>

          <Plate>
            <div className="panel-header">
              <div className="panel-title">Réserve en cours</div>
            </div>
            {reserveActive ? (
              <div style={{ padding: "18px 20px" }}>
                <Badge tone={CRITICITE_TONE[reserveActive.criticite]}>
                  {reserveActive.criticite}
                </Badge>{" "}
                <Badge tone={RESERVE_STATUT_TONE[reserveActive.statut]}>
                  {reserveActive.statut}
                </Badge>
                <div style={{ fontSize: 13.5, marginTop: 10 }}>
                  {reserveActive.nature}
                </div>
                <div className="spec-label" style={{ marginTop: 12 }}>
                  Délai de levée réglementaire
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}
                >
                  {reserveActive.delaiLevee}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: 12.5, padding: "7px 14px" }}
                  onClick={() =>
                    navigate(`/reserves/${controleAvecReserveActive.id}/lever`)
                  }
                >
                  Lever la réserve
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Aucune réserve ouverte.
              </div>
            )}
          </Plate>
        </div>
      </div>
    </>
  );
}
