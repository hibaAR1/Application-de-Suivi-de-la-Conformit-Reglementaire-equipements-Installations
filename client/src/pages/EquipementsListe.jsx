import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import { useEquipements } from "../context/EquipementsContext";
import { useAuth } from "../context/AuthContext";

const STATUT_TONE = {
  "En service": "success",
  "En réserve": "warning",
  "Hors service": "danger",
  Réformé: "danger",
};

export default function EquipementsListe() {
  const { equipements, chargement, erreur } = useEquipements();
  const { user } = useAuth();
  const [recherche, setRecherche] = useState("");
  const navigate = useNavigate();

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return equipements;
    return equipements.filter(
      (e) =>
        e.id_equipement?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.numero_serie?.toLowerCase().includes(q),
    );
  }, [equipements, recherche]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            {user?.voitToutesFiliales
              ? "Toutes filiales"
              : `Filiale ${user?.filialeCode ?? ""}`}
          </div>
          <h1 style={{ fontSize: "22px" }}>Équipements</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/equipements/nouveau")}
        >
          + Nouvel équipement
        </button>
      </div>

      <div className="content">
        <div className="field" style={{ maxWidth: 320, marginBottom: 18 }}>
          <input
            type="text"
            placeholder="Rechercher (référence, désignation, n° série)…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
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
                      <th>Référence</th>
                      <th>Désignation</th>
                      <th>Type</th>
                      <th>Périodicité</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtres.map((eq) => (
                      <tr
                        key={eq.id_equipement}
                        className="rowlink"
                        onClick={() =>
                          navigate(`/equipements/${eq.id_equipement}`)
                        }
                      >
                        <td className="ref">{eq.id_equipement}</td>
                        <td style={{ fontWeight: 600 }}>{eq.designation}</td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {eq.type_equipement?.libelle ?? "—"}
                        </td>
                        <td>
                          {eq.type_equipement?.periodicite_mois
                            ? `${eq.type_equipement.periodicite_mois} mois`
                            : "—"}
                        </td>
                        <td>
                          <Badge tone={STATUT_TONE[eq.statut] ?? "success"}>
                            {eq.statut}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Plate>

            {filtres.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  marginTop: 24,
                }}
              >
                Aucun équipement ne correspond à cette recherche.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
