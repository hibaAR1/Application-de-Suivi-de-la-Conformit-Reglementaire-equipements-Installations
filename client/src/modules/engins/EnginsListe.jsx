import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import { useEquipements } from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { useAuth } from "../../context/AuthContext";
import EnginModal from "./EnginModal";
import FicheTechniqueEnginModal from "./FicheTechniqueEnginModal";
import NouveauTypeModal from "../equipements/NouveauTypeModal";
import NouveauGroupeModal from "../equipements/NouveauGroupeModal";
import { useImportEngins } from "./utils/useImportEngins";

const STATUT_TONE = {
  Conforme: "success",
  "Conforme avec réserve": "warning",
  "Non conforme": "danger",
};

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

// Le contrôle le plus récent d'un engin (colonnes "Dernier Ctr." / "Prochain").
function dernierControle(en) {
  if (!en.controles?.length) return null;
  return [...en.controles].sort(
    (a, b) => new Date(b.date_controle) - new Date(a.date_controle),
  )[0];
}

// Nombre de réserves encore ouvertes (statut différent de "Clôturée").
function reservesOuvertes(en) {
  return (en.controles ?? []).reduce(
    (total, c) =>
      total + (c.reserves ?? []).filter((r) => r.statut !== "Clôturée").length,
    0,
  );
}

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

// Liste des ENGINS (table "engin", séparée de "equipement") : filtres,
// colonnes de contrôle, fiche détaillée ("Ouvrir"), modification, suppression.
export default function EnginsListe() {
  const {
    typesEquipement,
    groupesEquipement,
    filiales: filialesToutes,
  } = useEquipements();
  const { engins, chargement, erreur, supprimerEngin } = useEngins();
  const { filiales, onglets, filialeActive } = useFilialeTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recherche, setRecherche] = useState("");
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [nouveauTypeOuvert, setNouveauTypeOuvert] = useState(false);
  const [nouveauGroupeOuvert, setNouveauGroupeOuvert] = useState(false);
  const [statutFiltre, setStatutFiltre] = useState("");
  const [fichierOuvert, setFichierOuvert] = useState(null);
  const [ficheOuverte, setFicheOuverte] = useState(null);
  const {
    telechargerCanevas,
    gererImportFichier,
    importEnCours,
    resultatImport,
    setResultatImport,
    inputImportRef,
  } = useImportEngins();

  const peutCreer = user?.hasPermission("equipements.create");
  const peutModifier = user?.hasPermission("equipements.edit");
  const peutSupprimer = user?.hasPermission("equipements.delete");

  async function supprimer(engin) {
    if (
      !window.confirm(
        `Supprimer l'engin "${engin.id_engin}" (${engin.designation ?? "sans désignation"}) ? Cette action est irréversible.`,
      )
    )
      return;
    try {
      await supprimerEngin(engin.id_engin);
    } catch (e) {
      alert(e.message);
    }
  }

  // Groupes proposés : Fixe/Mobile, plus ceux des types existants, plus ceux
  // de la table groupe_equipement (mêmes tables que pour les équipements).
  const groupesDisponibles = useMemo(() => {
    const set = new Set(["Fixe", "Mobile"]);
    typesEquipement.forEach((t) => t.categorie && set.add(t.categorie));
    groupesEquipement.forEach((g) => set.add(g.libelle));
    return Array.from(set);
  }, [typesEquipement, groupesEquipement]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return engins.filter((e) => {
      if (
        filialeActive &&
        filialeActive !== "GROUPE" &&
        e.filiale?.code !== filialeActive
      )
        return false;
      if (filialeFiltre && e.filiale?.code !== filialeFiltre) return false;
      if (categorieFiltre && e.type_equipement?.categorie !== categorieFiltre)
        return false;
      if (typeFiltre && String(e.id_type_equipement) !== String(typeFiltre))
        return false;
      if (statutFiltre && e.statut !== statutFiltre) return false;
      if (
        q &&
        !(
          e.id_engin?.toLowerCase().includes(q) ||
          e.designation?.toLowerCase().includes(q) ||
          e.type_equipement?.libelle?.toLowerCase().includes(q) ||
          e.immatriculation?.toLowerCase().includes(q) ||
          e.numero_serie?.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [
    engins,
    recherche,
    filialeActive,
    filialeFiltre,
    categorieFiltre,
    typeFiltre,
    statutFiltre,
  ]);

  // Compteurs par groupe pour la ligne sous le titre ("0 mobiles / 3 fixes"),
  // calculés sur les engins de la filiale choisie (sans tenir compte des
  // autres filtres, pour afficher tous les totaux).
  const compteurs = useMemo(() => {
    const base = engins.filter(
      (e) =>
        !(
          filialeActive &&
          filialeActive !== "GROUPE" &&
          e.filiale?.code !== filialeActive
        ) && !(filialeFiltre && e.filiale?.code !== filialeFiltre),
    );
    const parGroupe = {};
    base.forEach((e) => {
      const g = e.type_equipement?.categorie ?? "Non classé";
      parGroupe[g] = (parGroupe[g] ?? 0) + 1;
    });
    const ordre = [
      ...groupesDisponibles,
      ...Object.keys(parGroupe).filter((g) => !groupesDisponibles.includes(g)),
    ];
    return {
      total: base.length,
      parGroupe,
      ordre: ordre.filter((g) => parGroupe[g]),
    };
  }, [engins, filialeActive, filialeFiltre, groupesDisponibles]);

  function libelleGroupe(g) {
    if (g === "Mobile") return "mobiles";
    if (g === "Fixe") return "fixes";
    return `${g.toLowerCase()}(s)`;
  }

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
          <h1 style={{ fontSize: "22px" }}>Engins</h1>
          <div
            style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}
          >
            {compteurs.total} engin(s)
            {compteurs.ordre.length > 0 && " — "}
            {compteurs.ordre
              .map((g) => `${compteurs.parGroupe[g]} ${libelleGroupe(g)}`)
              .join(" / ")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {peutCreer && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={telechargerCanevas}
              >
                Canevas
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={importEnCours}
                onClick={() => inputImportRef.current?.click()}
              >
                {importEnCours ? "Import en cours…" : "Importer"}
              </button>
              <input
                ref={inputImportRef}
                type="file"
                accept=".xlsx"
                style={{ display: "none" }}
                onChange={gererImportFichier}
              />
            </>
          )}
          {peutCreer && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/engins-mobiles/nouveau")}
            >
              + Nouvel engin
            </button>
          )}
        </div>
      </div>

      <div className="content">
        {resultatImport && (
          <Plate
            style={{
              padding: 14,
              marginBottom: 16,
              borderColor:
                resultatImport.erreurs.length > 0
                  ? "var(--danger)"
                  : "var(--success)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Import terminé : {resultatImport.succes} /{" "}
                {resultatImport.total} engin(s) créé(s).
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "2px 8px", fontSize: 11.5 }}
                onClick={() => setResultatImport(null)}
              >
                Fermer
              </button>
            </div>
            {resultatImport.erreurs.length > 0 && (
              <ul
                style={{
                  marginTop: 8,
                  paddingLeft: 18,
                  fontSize: 12.5,
                  color: "var(--danger)",
                }}
              >
                {resultatImport.erreurs.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </Plate>
        )}
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
              placeholder="Rechercher(ID, nom, type, immat…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="field" style={{ maxWidth: 200, marginBottom: 0 }}>
            <select
              value={filialeFiltre}
              onChange={(e) => setFilialeFiltre(e.target.value)}
            >
              <option value="">Toutes filiales</option>
              {(onglets?.length
                ? onglets.filter((c) => c !== "GROUPE")
                : filialesToutes.map((f) => f.code)
              ).map((code) => (
                <option key={code} value={code}>
                  {filialesToutes.find((f) => f.code === code)?.libelle ?? code}
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
                {typesEquipement.map((t) => (
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
                      <th>Désignation</th>
                      <th>Site</th>
                      <th>Dernier Ctr.</th>
                      <th>Prochain</th>
                      <th>Réserves</th>
                      <th>Statut</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtres.map((en) => {
                      const dernier = dernierControle(en);
                      const nbReserves = reservesOuvertes(en);
                      return (
                        <tr
                          key={en.id_engin}
                          className="rowlink"
                          style={{ cursor: "pointer" }}
                          onClick={() => setFichierOuvert(en.id_engin)}
                        >
                          <td className="ref">{en.id_engin}</td>
                          <td style={{ fontWeight: 600 }}>
                            {en.filiale?.libelle ?? "—"}
                          </td>
                          <td>
                            <Badge
                              tone={
                                en.type_equipement?.categorie === "Mobile"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {en.type_equipement?.categorie ??
                                en.filiale?.code ??
                                "—"}
                            </Badge>
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {en.type_equipement?.libelle ?? "—"}
                          </td>
                          <td>{en.designation ?? "—"}</td>
                          <td>{en.site?.libelle ?? "—"}</td>
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
                            <Badge tone={STATUT_TONE[en.statut] ?? "success"}>
                              {en.statut}
                            </Badge>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: "4px 10px", fontSize: 12.5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFichierOuvert(en.id_engin);
                                }}
                              >
                                Ouvrir
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                title="Étiquette QR"
                                style={{ padding: "4px 8px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFicheOuverte(en.id_engin);
                                }}
                              >
                                <IconQr />
                              </button>
                              {peutModifier && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  title="Modifier"
                                  style={{ padding: "4px 8px" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/engins-mobiles/${en.id_engin}/modifier`,
                                    );
                                  }}
                                >
                                  ✎
                                </button>
                              )}
                              {peutSupprimer && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  title="Supprimer"
                                  style={{
                                    padding: "4px 8px",
                                    color: "var(--danger)",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    supprimer(en);
                                  }}
                                >
                                  🗑
                                </button>
                              )}
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
                Aucun engin pour le moment.
              </p>
            )}
          </>
        )}
      </div>

      {fichierOuvert && (
        <EnginModal id={fichierOuvert} onClose={() => setFichierOuvert(null)} />
      )}

      {nouveauTypeOuvert && (
        <NouveauTypeModal
          onClose={() => setNouveauTypeOuvert(false)}
          onCree={(type) => setTypeFiltre(String(type.id_type_equipement))}
        />
      )}

      {nouveauGroupeOuvert && (
        <NouveauGroupeModal
          onClose={() => setNouveauGroupeOuvert(false)}
          onCree={(groupe) => {
            setCategorieFiltre(groupe.libelle);
            setTypeFiltre("");
          }}
        />
      )}

      {ficheOuverte && (
        <FicheTechniqueEnginModal
          id={ficheOuverte}
          onClose={() => setFicheOuverte(null)}
        />
      )}
    </>
  );
}
