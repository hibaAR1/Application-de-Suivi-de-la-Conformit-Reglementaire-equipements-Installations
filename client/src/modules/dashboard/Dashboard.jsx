import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import Gauge from "../../components/Gauge";
import EquipementModal from "../equipements/EquipementModal";
import { IconQr } from "../../components/icons";
import { useAuth } from "../../context/AuthContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { apiFetch } from "../../utils/api";
import { statutEcheance, formatDateFR } from "./utils/echeance";

const STATUT_BADGE = {
  retard: <Badge tone="danger">Retard</Badge>,
  j0: <Badge tone="danger">J-0</Badge>,
  j15: <Badge tone="warning">J-15</Badge>,
  j30: <Badge tone="success">J-30</Badge>,
  ok: <Badge tone="success">À jour</Badge>,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // La filiale active et la liste des filiales viennent maintenant du contexte
  // partagé (chargées une seule fois, utilisées aussi par la Sidebar).
  const { filialeActive, filiales } = useFilialeTheme();
  const [equipements, setEquipements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [fichierOuvert, setFichierOuvert] = useState(null);
  // Charge les équipements (+ contrôles + réserves) selon la filiale active
  useEffect(() => {
    setChargement(true);
    setErreur(null);

    const params =
      filialeActive && filialeActive !== "GROUPE"
        ? `?id_filiale=${filiales.find((f) => f.code === filialeActive)?.id_filiale ?? ""}`
        : "";

    apiFetch(`/equipements${params}`)
      .then(setEquipements)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [filialeActive, filiales]);

  // §3.2 : le moteur d'alertes se base sur la "prochaine échéance" du dernier contrôle de chaque équipement
  const echeances = useMemo(() => {
    return equipements
      .map((eq) => {
        const dernierControle = [...(eq.controles ?? [])].sort((a, b) =>
          a.date_controle < b.date_controle ? 1 : -1,
        )[0];
        if (!dernierControle) return null;
        return {
          equipement: eq,
          prochaineEcheance: dernierControle.prochaine_echeance,
          statut: statutEcheance(dernierControle.prochaine_echeance),
        };
      })
      .filter((e) => e && e.statut !== "ok")
      .sort((a, b) => (a.prochaineEcheance < b.prochaineEcheance ? -1 : 1));
  }, [equipements]);

  const reservesOuvertes = useMemo(() => {
    const liste = [];
    for (const eq of equipements) {
      for (const c of eq.controles ?? []) {
        for (const r of c.reserves ?? []) {
          if (r.statut !== "Levée") liste.push({ equipement: eq, reserve: r });
        }
      }
    }
    return liste;
  }, [equipements]);

  const enRetard = echeances.filter((e) => e.statut === "retard");

  const tauxConformite = useMemo(() => {
    if (equipements.length === 0) return null;
    const refsEnDefaut = new Set(
      reservesOuvertes
        .filter((r) => r.reserve.niveau_criticite === "Bloquante")
        .map((r) => r.equipement.id_equipement),
    );
    return Math.round(
      ((equipements.length - refsEnDefaut.size) / equipements.length) * 100,
    );
  }, [equipements, reservesOuvertes]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            {filialeActive === "GROUPE"
              ? "Toutes les filiales"
              : (filiales.find((f) => f.code === filialeActive)?.libelle ??
                `Filiale ${filialeActive ?? ""}`)}
          </div>
          <h1 style={{ fontSize: "22px" }}>Tableau de bord</h1>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/scanner")}
        >
          <IconQr /> Scanner un équipement
        </button>
      </div>

      <div className="content">
        {erreur && (
          <Plate style={{ padding: 16, color: "var(--danger)" }}>
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
                  <Gauge percent={tauxConformite ?? 0} />
                  <div className="gauge-label" style={{ marginTop: 8 }}>
                    Taux de conformité
                  </div>
                  <div className="stat-sub" style={{ marginTop: 2 }}>
                    {tauxConformite === null
                      ? "Aucun équipement suivi"
                      : `${equipements.length} équipements suivis`}
                  </div>
                </div>
              </Plate>
              <div className="stat-row">
                <Plate>
                  <div style={{ padding: "16px 18px" }}>
                    <div className="stat-label">Réserves ouvertes</div>
                    <div className="stat-value">{reservesOuvertes.length}</div>
                    <div className="stat-sub">
                      dont{" "}
                      {
                        reservesOuvertes.filter(
                          (r) => r.reserve.niveau_criticite === "Bloquante",
                        ).length
                      }{" "}
                      bloquante(s)
                    </div>
                  </div>
                </Plate>
                <Plate>
                  <div style={{ padding: "16px 18px" }}>
                    <div className="stat-label">En retard</div>
                    <div
                      className="stat-value"
                      style={{ color: "var(--danger)" }}
                    >
                      {enRetard.length}
                    </div>
                    <div className="stat-sub ref">
                      {enRetard[0]?.equipement.id_equipement ?? "—"}
                    </div>
                  </div>
                </Plate>
                <Plate>
                  <div style={{ padding: "16px 18px" }}>
                    <div className="stat-label">Échéances ≤ 30j</div>
                    <div
                      className="stat-value"
                      style={{ color: "var(--gold)" }}
                    >
                      {echeances.length}
                    </div>
                    <div className="stat-sub">contrôles à planifier</div>
                  </div>
                </Plate>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr",
                gap: "16px",
              }}
            >
              <Plate>
                <div className="panel-header">
                  <div className="panel-title">Prochaines échéances</div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "11.5px", padding: "6px 12px" }}
                  >
                    Exporter
                  </button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Équipement</th>
                        <th>Type</th>
                        <th>Échéance</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {echeances.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              textAlign: "center",
                              color: "var(--text-muted)",
                            }}
                          >
                            Aucune échéance à venir.
                          </td>
                        </tr>
                      ) : (
                        echeances.map((e) => (
                          <tr
                            key={e.equipement.id_equipement}
                            className="rowlink"
                            onClick={() =>
                              setFichierOuvert(e.equipement.id_equipement)
                            }
                          >
                            <td>
                              <div style={{ fontWeight: 600 }}>
                                {e.equipement.designation}
                              </div>
                              <div className="ref">
                                {e.equipement.id_equipement}
                              </div>
                            </td>
                            <td style={{ color: "var(--text-muted)" }}>
                              {e.equipement.type_equipement?.libelle ?? "—"}
                            </td>
                            <td className="mono">
                              {formatDateFR(e.prochaineEcheance)}
                            </td>
                            <td>{STATUT_BADGE[e.statut]}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Plate>

              <Plate>
                <div className="panel-header">
                  <div className="panel-title">Réserves à traiter</div>
                </div>
                <div style={{ padding: "6px 4px" }}>
                  {reservesOuvertes.length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        color: "var(--text-muted)",
                        fontSize: 13,
                      }}
                    >
                      Aucune réserve ouverte.
                    </div>
                  ) : (
                    reservesOuvertes.map((r, i) => (
                      <div
                        key={r.reserve.id_reserve}
                        className="rowlink"
                        onClick={() =>
                          setFichierOuvert(r.equipement.id_equipement)
                        }
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            i < reservesOuvertes.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <div className="ref">
                            {r.equipement.id_equipement}
                          </div>
                          <Badge
                            tone={
                              r.reserve.niveau_criticite === "Bloquante"
                                ? "danger"
                                : r.reserve.niveau_criticite === "Majeure"
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {r.reserve.niveau_criticite} · {r.reserve.statut}
                          </Badge>
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          {r.reserve.nature_reserve}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Plate>
            </div>
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
