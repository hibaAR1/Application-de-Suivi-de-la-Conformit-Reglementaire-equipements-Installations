import { useParams, useNavigate } from "react-router-dom";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import QRVisual from "../components/QRVisual";
import { IconChevron } from "../components/icons";
import { useEquipements } from "../context/EquipementsContext";

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
  const { getByRef, chargement } = useEquipements();

  const eq = getByRef(ref);

  if (chargement && !eq) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>Chargement...</Plate>
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>Équipement "{ref}" introuvable.</Plate>
      </div>
    );
  }

  const historique = [...(eq.controles ?? [])].sort((a, b) =>
    a.date_controle < b.date_controle ? 1 : -1,
  );

  let reserveActive = null;
  let controleAvecReserveActive = null;
  for (const c of historique) {
    const r = (c.reserves ?? []).find((res) => res.statut !== "Levée");
    if (r) {
      reserveActive = r;
      controleAvecReserveActive = c;
      break;
    }
  }

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
          Équipements <IconChevron />{" "}
          <span className="ref">{eq.id_equipement}</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/equipements/${eq.id_equipement}/modifier`)}
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
          <QRVisual valeur={eq.id_equipement} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow">{eq.type_equipement?.libelle}</div>
            <h2 style={{ fontSize: "21px", marginBottom: 4 }}>
              {eq.designation}
            </h2>
            <div className="ref">{eq.id_equipement}</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ width: 280 }}>
            <div className="spec-row">
              <span className="spec-label">Filiale</span>
              <span>{eq.filiale?.libelle ?? eq.filiale?.code}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Mise en service</span>
              <span className="mono">{eq.date_mise_en_service}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Périodicité</span>
              <span>{eq.type_equipement?.periodicite_mois} mois</span>
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
                    <tr key={h.id_controle}>
                      <td className="mono">{h.date_controle}</td>
                      <td>{h.organisme_controle}</td>
                      <td>
                        <Badge
                          tone={
                            h.resultat_global === "Favorable"
                              ? "success"
                              : h.resultat_global === "Défavorable"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {h.resultat_global}
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
                <Badge tone={CRITICITE_TONE[reserveActive.niveau_criticite]}>
                  {reserveActive.niveau_criticite}
                </Badge>{" "}
                <Badge tone={RESERVE_STATUT_TONE[reserveActive.statut]}>
                  {reserveActive.statut}
                </Badge>
                <div style={{ fontSize: 13.5, marginTop: 10 }}>
                  {reserveActive.nature_reserve}
                </div>
                <div className="spec-label" style={{ marginTop: 12 }}>
                  Délai de levée réglementaire
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}
                >
                  {reserveActive.delai_levee}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: 12.5, padding: "7px 14px" }}
                  onClick={() =>
                    navigate(`/reserves/${reserveActive.id_reserve}/lever`)
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
