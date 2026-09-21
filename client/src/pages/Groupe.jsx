import { useEffect, useMemo, useState } from "react";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import Gauge from "../components/Gauge";
import { apiFetch } from "../utils/api";

// Objectif 6 du CDC : "tableaux de bord de pilotage par filiale et consolidés Groupe".
// §3.4 : "Vue consolidée Groupe : agrégation multi-filiales, comparatif inter-sites."
export default function Groupe() {
  const [filiales, setFiliales] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    Promise.all([apiFetch("/filiales"), apiFetch("/equipements")])
      .then(([f, e]) => {
        setFiliales(f);
        setEquipements(e);
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  const stats = useMemo(() => {
    return filiales.map((f) => {
      const eqFiliale = equipements.filter(
        (e) => e.id_filiale === f.id_filiale,
      );
      let ouvertes = 0;
      let retard = 0;
      let bloquantesEnDefaut = 0;
      const refsEnDefaut = new Set();
      for (const eq of eqFiliale) {
        for (const c of eq.controles ?? []) {
          for (const r of c.reserves ?? []) {
            if (r.statut !== "Levée") {
              ouvertes += 1;
              if (r.statut === "En retard") retard += 1;
              if (r.niveau_criticite === "Bloquante")
                refsEnDefaut.add(eq.id_equipement);
            }
          }
        }
      }
      const taux =
        eqFiliale.length === 0
          ? null
          : Math.round(
              ((eqFiliale.length - refsEnDefaut.size) / eqFiliale.length) * 100,
            );
      return {
        code: f.code,
        nom: f.libelle ?? f.code,
        taux,
        ouvertes,
        retard,
        nbEquipements: eqFiliale.length,
      };
    });
  }, [filiales, equipements]);

  const statsAvecTaux = stats.filter((f) => f.taux !== null);
  const moyenne =
    statsAvecTaux.length === 0
      ? null
      : Math.round(
          statsAvecTaux.reduce((s, f) => s + f.taux, 0) / statsAvecTaux.length,
        );
  const pire =
    statsAvecTaux.length === 0
      ? null
      : statsAvecTaux.reduce((a, b) => (b.taux < a.taux ? b : a));
  const meilleure =
    statsAvecTaux.length === 0
      ? null
      : statsAvecTaux.reduce((a, b) => (b.taux > a.taux ? b : a));

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Toutes filiales</div>
          <h1 style={{ fontSize: "22px" }}>Vue consolidée Groupe</h1>
        </div>
        <button className="btn btn-secondary">
          Exporter le rapport Groupe
        </button>
      </div>

      <div className="content">
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
            <div className="hero-row">
              <Plate style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Gauge percent={moyenne ?? 0} />
                  <div className="gauge-label" style={{ marginTop: 8 }}>
                    Conformité moyenne Groupe
                  </div>
                  <div className="stat-sub" style={{ marginTop: 2 }}>
                    {filiales.length} filiales
                  </div>
                </div>
              </Plate>
              <div className="stat-row">
                <Plate>
                  <div style={{ padding: "16px 18px" }}>
                    <div className="stat-label">Réserves ouvertes (Groupe)</div>
                    <div className="stat-value">
                      {stats.reduce((s, f) => s + f.ouvertes, 0)}
                    </div>
                    <div className="stat-sub">
                      dont {stats.reduce((s, f) => s + f.retard, 0)} en retard
                    </div>
                  </div>
                </Plate>
                <Plate>
                  <div style={{ padding: "16px 18px" }}>
                    <div className="stat-label">Filiale la plus exposée</div>
                    <div
                      className="stat-value"
                      style={{ color: "var(--danger)", fontSize: 22 }}
                    >
                      {pire?.code ?? "—"}
                    </div>
                    <div className="stat-sub">
                      {pire
                        ? `${pire.taux} % de conformité`
                        : "Pas assez de données"}
                    </div>
                  </div>
                </Plate>
                <Plate>
                  <div style={{ padding: "16px 18px" }}>
                    <div className="stat-label">Filiale la mieux notée</div>
                    <div
                      className="stat-value"
                      style={{ color: "var(--success)", fontSize: 22 }}
                    >
                      {meilleure?.code ?? "—"}
                    </div>
                    <div className="stat-sub">
                      {meilleure
                        ? `${meilleure.taux} % de conformité`
                        : "Pas assez de données"}
                    </div>
                  </div>
                </Plate>
              </div>
            </div>

            <Plate>
              <div className="panel-header">
                <div className="panel-title">Comparatif inter-sites</div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Filiale</th>
                      <th>Taux de conformité</th>
                      <th>Réserves ouvertes</th>
                      <th>En retard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((f) => (
                      <tr key={f.code}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{f.nom}</div>
                          <div className="ref">{f.code}</div>
                        </td>
                        <td>
                          {f.taux === null ? (
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: 12.5,
                              }}
                            >
                              Aucun équipement
                            </span>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 120,
                                  height: 6,
                                  borderRadius: 3,
                                  background: "var(--border)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${f.taux}%`,
                                    height: "100%",
                                    background:
                                      f.taux >= 90
                                        ? "var(--success)"
                                        : f.taux >= 80
                                          ? "var(--gold)"
                                          : "var(--danger)",
                                  }}
                                />
                              </div>
                              <span className="mono" style={{ fontSize: 12.5 }}>
                                {f.taux}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td>{f.ouvertes}</td>
                        <td>
                          {f.retard > 0 ? (
                            <Badge tone="danger">{f.retard}</Badge>
                          ) : (
                            <Badge tone="success">0</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Plate>
          </>
        )}
      </div>
    </>
  );
}
