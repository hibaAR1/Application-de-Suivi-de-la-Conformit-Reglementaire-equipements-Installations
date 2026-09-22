import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import { useEquipements } from "../context/EquipementsContext";
import { useFilialeTheme } from "../context/FilialeThemeContext";

const STATUT_TONE = {
  "En service": "success",
  "En réserve": "warning",
  "Hors service": "danger",
  Réformé: "danger",
};

const TITRES = { Fixe: "Équipements fixes", Mobile: "Engins mobiles" };

// Icône "étiquette QR" — renvoie vers la fiche équipement, où l'étiquette est affichée.
function IconQr() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

// Le contrôle le plus récent d'un équipement (pour les colonnes "Dernier Ctr." / "Prochain").
function dernierControle(eq) {
  if (!eq.controles?.length) return null;
  return [...eq.controles].sort(
    (a, b) => new Date(b.date_controle) - new Date(a.date_controle),
  )[0];
}

// Nombre de réserves encore ouvertes (statut différent de "Clôturée").
function reservesOuvertes(eq) {
  return (eq.controles ?? []).reduce(
    (total, c) =>
      total + (c.reserves ?? []).filter((r) => r.statut !== "Clôturée").length,
    0,
  );
}

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

export default function EquipementsListe({ categorie }) {
  const { equipements, typesEquipement, chargement, erreur } = useEquipements();
  const { filiales, onglets, filialeActive } = useFilialeTheme();
  const [recherche, setRecherche] = useState("");
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const navigate = useNavigate();

  const titre = TITRES[categorie] ?? "Équipements";

  const typesDisponibles = useMemo(
    () =>
      categorie
        ? typesEquipement.filter((t) => t.categorie === categorie)
        : typesEquipement,
    [typesEquipement, categorie],
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return equipements.filter((e) => {
      if (categorie && e.type_equipement?.categorie !== categorie) return false;
      if (
        filialeActive &&
        filialeActive !== "GROUPE" &&
        e.filiale?.code !== filialeActive
      )
        return false;
      if (filialeFiltre && e.filiale?.code !== filialeFiltre) return false;
      if (typeFiltre && String(e.id_type_equipement) !== String(typeFiltre))
        return false;
      if (statutFiltre && e.statut !== statutFiltre) return false;
      if (
        q &&
        !(
          e.id_equipement?.toLowerCase().includes(q) ||
          e.designation?.toLowerCase().includes(q) ||
          e.numero_serie?.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [
    equipements,
    recherche,
    categorie,
    filialeActive,
    filialeFiltre,
    typeFiltre,
    statutFiltre,
  ]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            {filialeActive === "GROUPE" || !filialeActive
              ? "Toutes les filiales"
              : (filiales.find((f) => f.code === filialeActive)?.libelle ??
                `Filiale ${filialeActive}`)}
          </div>
          <h1 style={{ fontSize: "22px" }}>{titre}</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/equipements/nouveau")}
        >
          + Nouvel équipement
        </button>
      </div>

      <div className="content">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div className="field" style={{ maxWidth: 280, marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Rechercher (référence, désignation, n° série)…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="field" style={{ maxWidth: 200, marginBottom: 0 }}>
            <select
              value={filialeFiltre}
              onChange={(e) => setFilialeFiltre(e.target.value)}
            >
              <option value="">Toutes les filiales</option>
              {(onglets?.length
                ? onglets.filter((c) => c !== "GROUPE")
                : filiales.map((f) => f.code)
              ).map((code) => (
                <option key={code} value={code}>
                  {filiales.find((f) => f.code === code)?.libelle ?? code}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ maxWidth: 220, marginBottom: 0 }}>
            <select
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
            >
              <option value="">Tous les types</option>
              {typesDisponibles.map((t) => (
                <option key={t.id_type_equipement} value={t.id_type_equipement}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ maxWidth: 200, marginBottom: 0 }}>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {Object.keys(STATUT_TONE).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
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
                      <th>Filiale</th>
                      <th>Groupe</th>
                      <th>Type</th>
                      <th>Site</th>
                      <th>Dernier Ctr.</th>
                      <th>Prochain</th>
                      <th>Réserves</th>
                      <th>Statut</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtres.map((eq) => {
                      const dernier = dernierControle(eq);
                      const nbReserves = reservesOuvertes(eq);
                      return (
                        <tr key={eq.id_equipement} className="rowlink">
                          <td style={{ fontWeight: 600 }}>
                            {eq.filiale?.libelle ?? "—"}
                          </td>
                          <td>
                            <Badge tone="success">
                              {eq.filiale?.code ?? "—"}
                            </Badge>
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {eq.type_equipement?.libelle ?? "—"}
                          </td>
                          <td>{eq.site?.libelle ?? "—"}</td>
                          <td>{formaterDate(dernier?.date_controle)}</td>
                          <td>{formaterDate(dernier?.prochaine_echeance)}</td>
                          <td>
                            {nbReserves > 0 ? (
                              <Badge tone="warning">{nbReserves}</Badge>
                            ) : (
                              <Badge tone="success">0</Badge>
                            )}
                          </td>
                          <td>
                            <Badge tone={STATUT_TONE[eq.statut] ?? "success"}>
                              {eq.statut}
                            </Badge>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: "4px 10px", fontSize: 12.5 }}
                                onClick={() =>
                                  navigate(`/equipements/${eq.id_equipement}`)
                                }
                              >
                                Ouvrir
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                title="Étiquette QR"
                                style={{ padding: "4px 8px" }}
                                onClick={() =>
                                  navigate(`/equipements/${eq.id_equipement}`)
                                }
                              >
                                <IconQr />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                Aucun équipement ne correspond à ces critères.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
