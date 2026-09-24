import { useState, useMemo } from "react";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import EquipementModal from "../equipements/EquipementModal";
import { useControles } from "../../context/ControlesContext";
import { useEquipements } from "../../context/EquipementsContext";

const FILTRES = [
  { id: "tous", label: "Tous" },
  { id: "Favorable", label: "Favorable" },
  { id: "Favorable avec réserves", label: "Avec réserves" },
  { id: "Défavorable", label: "Défavorable" },
];
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

export default function Controles() {
  const [filtre, setFiltre] = useState("tous");
  const { controles, chargement, erreur } = useControles();
  const { getByRef } = useEquipements();
  const [fichierOuvert, setFichierOuvert] = useState(null);

  const controlesFiltres = useMemo(
    () =>
      filtre === "tous"
        ? controles
        : controles.filter((c) => c.resultat_global === filtre),
    [controles, filtre],
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Suivi des contrôles</div>
          <h1 style={{ fontSize: "22px" }}>Contrôles & réserves</h1>
        </div>
      </div>

      <div className="content">
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className={
                filtre === f.id ? "btn btn-primary" : "btn btn-secondary"
              }
              style={{ fontSize: 12.5, padding: "7px 14px" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}
          >
            {erreur}
          </Plate>
        )}

        {chargement ? (
          <Plate style={{ padding: 16 }}>Chargement...</Plate>
        ) : (
          <>
            <Plate>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Équipement</th>
                      <th>Date contrôle</th>
                      <th>Organisme</th>
                      <th>Résultat</th>
                      <th>Réserve</th>
                      <th>Statut réserve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controlesFiltres.map((c) => {
                      const eq = getByRef(c.id_equipement);
                      const reserve = (c.reserves ?? [])[0];
                      return (
                        <tr
                          key={c.id_controle}
                          className="rowlink"
                          onClick={() => setFichierOuvert(c.id_equipement)}
                        >
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {eq?.designation ?? c.id_equipement}
                            </div>
                            <div className="ref">{c.id_equipement}</div>
                          </td>
                          <td className="mono">{c.date_controle}</td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {c.organisme_controle}
                          </td>
                          <td>
                            <Badge
                              tone={
                                c.resultat_global === "Favorable"
                                  ? "success"
                                  : c.resultat_global === "Défavorable"
                                    ? "danger"
                                    : "warning"
                              }
                            >
                              {c.resultat_global}
                            </Badge>
                          </td>
                          <td style={{ maxWidth: 220 }}>
                            {reserve ? (
                              <>
                                <div style={{ fontSize: 13 }}>
                                  {reserve.nature_reserve}
                                </div>
                                <Badge
                                  tone={
                                    CRITICITE_TONE[reserve.niveau_criticite]
                                  }
                                >
                                  {reserve.niveau_criticite}
                                </Badge>
                              </>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            {reserve ? (
                              <>
                                <Badge
                                  tone={RESERVE_STATUT_TONE[reserve.statut]}
                                >
                                  {reserve.statut}
                                </Badge>
                                <div
                                  className="mono"
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                    marginTop: 4,
                                  }}
                                >
                                  délai {reserve.delai_levee}
                                </div>
                              </>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Plate>

            {controlesFiltres.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  marginTop: 24,
                }}
              >
                Aucun contrôle ne correspond à ce filtre.
              </p>
            )}
          </>
        )}
      </div>

      {fichierOuvert && (
        <EquipementModal
          id={fichierOuvert}
          onClose={() => setFichierOuvert(null)}
        />
      )}
    </>
  );
}
