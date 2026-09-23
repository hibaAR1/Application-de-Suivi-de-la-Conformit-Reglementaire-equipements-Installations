import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../components/Plate";
import Badge from "../components/Badge";
import EquipementModal from "../components/EquipementModal";
import FicheTechniqueModal from "../components/FicheTechniqueModal";
import NouveauTypeModal from "../components/NouveauTypeModal";
import NouveauGroupeModal from "../components/NouveauGroupeModal";
import { useEquipements } from "../context/EquipementsContext";
import { useFilialeTheme } from "../context/FilialeThemeContext";
import { getGroupesPersonnalises } from "../utils/groupes";

const STATUT_TONE = {
  Conforme: "success",
  "Conforme avec réserve": "warning",
  "Non conforme": "danger",
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

// Nombre de réserves encore ouvertes (statut différent de "Levée").
function reservesOuvertes(eq) {
  return (eq.controles ?? []).reduce(
    (total, c) =>
      total + (c.reserves ?? []).filter((r) => r.statut !== "Levée").length,
    0,
  );
}

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

// categorie : valeur initiale du filtre Fixe/Mobile ("Fixe" pour le lien "Équipements
// fixes" du menu). L'utilisateur peut ensuite changer ce filtre depuis la page.
export default function EquipementsListe({ categorie }) {
  const { equipements, typesEquipement, chargement, erreur } = useEquipements();
  const { filiales, onglets, filialeActive } = useFilialeTheme();
  const [recherche, setRecherche] = useState("");
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState(categorie ?? "");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [fichierOuvert, setFichierOuvert] = useState(null);
  const [ficheOuverte, setFicheOuverte] = useState(null);
  const [nouveauTypeOuvert, setNouveauTypeOuvert] = useState(false);
  const [nouveauGroupeOuvert, setNouveauGroupeOuvert] = useState(false);
  const [versionGroupes, setVersionGroupes] = useState(0);
  const navigate = useNavigate();

  const titre = TITRES[categorieFiltre] ?? "Équipements";

  // Le menu "Type" affiche toujours TOUS les types (indépendant du filtre
  // "Groupe" choisi) : les 3 types de base + tous ceux ajoutés depuis les popups "+".
  const typesDisponibles = typesEquipement;

  // Liste des groupes proposés : Fixe/Mobile, plus ceux réellement utilisés par
  // les types existants, plus ceux créés à vide depuis la popup "+ nouveau groupe".
  const groupesDisponibles = useMemo(() => {
    const set = new Set(["Fixe", "Mobile"]);
    typesEquipement.forEach((t) => t.categorie && set.add(t.categorie));
    getGroupesPersonnalises().forEach((g) => set.add(g));
    return Array.from(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesEquipement, versionGroupes]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return equipements.filter((e) => {
      if (categorieFiltre && e.type_equipement?.categorie !== categorieFiltre)
        return false;
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
    categorieFiltre,
    filialeActive,
    filialeFiltre,
    typeFiltre,
    statutFiltre,
  ]);

  // Compteurs du sous-titre : sur l'ensemble filtré par filiale/recherche/type/statut,
  // sans tenir compte du filtre Fixe/Mobile lui-même (pour afficher les deux totaux).
  const compteurs = useMemo(() => {
    const base = equipements.filter((e) => {
      if (
        filialeActive &&
        filialeActive !== "GROUPE" &&
        e.filiale?.code !== filialeActive
      )
        return false;
      if (filialeFiltre && e.filiale?.code !== filialeFiltre) return false;
      return true;
    });
    return {
      total: base.length,
      fixes: base.filter((e) => e.type_equipement?.categorie === "Fixe").length,
      mobiles: base.filter((e) => e.type_equipement?.categorie === "Mobile")
        .length,
    };
  }, [equipements, filialeActive, filialeFiltre]);

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
          <div
            style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}
          >
            {compteurs.total} équipement(s) — {compteurs.mobiles} mobile(s) /{" "}
            {compteurs.fixes} fixe(s)
          </div>
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

          <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
            <div className="field" style={{ maxWidth: 180, marginBottom: 0 }}>
              <select
                value={categorieFiltre}
                onChange={(e) => setCategorieFiltre(e.target.value)}
              >
                <option value="">Tous les groupes</option>
                {groupesDisponibles.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              title="Créer un nouveau groupe"
              onClick={() => setNouveauGroupeOuvert(true)}
            >
              +
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
            <div className="field" style={{ maxWidth: 220, marginBottom: 0 }}>
              <select
                value={typeFiltre}
                onChange={(e) => setTypeFiltre(e.target.value)}
              >
                <option value="">Tous les types</option>
                {typesDisponibles.map((t) => (
                  <option
                    key={t.id_type_equipement}
                    value={t.id_type_equipement}
                  >
                    {t.libelle}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              title="Créer un nouveau type d'équipement"
              onClick={() => setNouveauTypeOuvert(true)}
            >
              +
            </button>
          </div>

          <div className="field" style={{ maxWidth: 200, marginBottom: 0 }}>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
            >
              <option value="">Tous statuts</option>
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
                      <th>Code</th>
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
                          <td className="ref">{eq.id_equipement}</td>
                          <td style={{ fontWeight: 600 }}>
                            {eq.filiale?.libelle ?? "—"}
                          </td>
                          <td>
                            <Badge
                              tone={
                                eq.type_equipement?.categorie === "Mobile"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {eq.type_equipement?.categorie ??
                                eq.filiale?.code ??
                                "—"}
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
                                className="btn btn-primary"
                                style={{ padding: "4px 10px", fontSize: 12.5 }}
                                onClick={() =>
                                  setFichierOuvert(eq.id_equipement)
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
                                  setFicheOuverte(eq.id_equipement)
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

      {fichierOuvert && (
        <EquipementModal
          id={fichierOuvert}
          onClose={() => setFichierOuvert(null)}
        />
      )}

      {nouveauTypeOuvert && (
        <NouveauTypeModal
          onClose={() => setNouveauTypeOuvert(false)}
          onCree={(type) => setTypeFiltre(String(type.id_type_equipement))}
        />
      )}

      {ficheOuverte && (
        <FicheTechniqueModal
          id={ficheOuverte}
          onClose={() => setFicheOuverte(null)}
        />
      )}

      {nouveauGroupeOuvert && (
        <NouveauGroupeModal
          onClose={() => setNouveauGroupeOuvert(false)}
          onCree={(groupe) => {
            setVersionGroupes((v) => v + 1);
            setCategorieFiltre(groupe);
            setTypeFiltre("");
          }}
        />
      )}
    </>
  );
}
