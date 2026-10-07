/*
 * ============================================================================
 * PAGE : Réserves & Plan d'action  (route /reserves)
 * ============================================================================
 *
 * RÔLE
 *   Liste unique de toutes les réserves (défauts à corriger relevés lors des
 *   contrôles), des équipements ET des engins. Chaque réserve est une carte
 *   avec son statut, sa gravité, sa filiale, sa nature et son délai de levée.
 *
 * FONCTIONNEMENT
 *   1. listerReserves() rassemble les réserves des équipements et des engins
 *      en une seule liste.
 *   2. Les filtres (origine, filiale, groupe, type, statut, gravité) et la
 *      filiale active du menu réduisent cette liste.
 *   3. Les réserves sont triées par délai de levée, la plus proche en
 *      premier.
 *   4. "Voir équipement" / "Voir engin" ouvre la fiche détaillée
 *      correspondante (EquipementModal ou EnginModal).
 * ============================================================================
 */
import { useMemo, useState } from "react";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import EquipementModal from "../equipements/EquipementModal";
import EnginModal from "../engins/EnginModal";
import { useEquipements } from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { statutEcheance } from "../dashboard/utils/echeance";

// Couleur du badge selon la gravité de la réserve.
const CRITICITE_TONE = {
  Mineure: "success",
  Majeure: "warning",
  Critique: "danger",
};
// Couleur du badge selon le statut de la réserve.
const STATUT_TONE = {
  Ouverte: "warning",
  "En cours": "warning",
  Clôturée: "success",
};

// Date au format français (JJ/MM/AAAA), ou "—" si elle est absente.
function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

// ------------------------------------------------------------------
// LISTE UNIQUE des réserves
// ------------------------------------------------------------------
// Aplatit (équipements + engins) -> contrôles -> réserves en une seule liste de
// cartes, pour pouvoir filtrer/afficher toutes les réserves ensemble. Les
// équipements et les engins restent dans des tables séparées en base
// (reserve / reserve_engin) : seule cette page les affiche ensemble.
// "origine" dit de quelle table vient la réserve ("equipement" ou "engin").
// "cle" est unique (préfixée par l'origine) car un même numéro de réserve peut
// exister dans les deux tables.
function listerReserves(equipements, engins) {
  const liste = [];
  for (const eq of equipements) {
    for (const c of eq.controles ?? []) {
      for (const r of c.reserves ?? []) {
        liste.push({
          origine: "equipement",
          cle: `equipement-${r.id_reserve}`,
          idMateriel: eq.id_equipement,
          materiel: eq,
          controle: c,
          reserve: r,
        });
      }
    }
  }
  for (const en of engins) {
    for (const c of en.controles ?? []) {
      for (const r of c.reserves ?? []) {
        liste.push({
          origine: "engin",
          cle: `engin-${r.id_reserve_engin}`,
          idMateriel: en.id_engin,
          materiel: en,
          controle: c,
          reserve: r,
        });
      }
    }
  }
  return liste;
}

// ------------------------------------------------------------------
// COMPOSANT
// ------------------------------------------------------------------
export default function ReservesPlanAction() {
  // Données : équipements, engins, listes de référence et filiales.
  const {
    equipements,
    typesEquipement,
    groupesEquipement,
    chargement: chargementEq,
    erreur: erreurEq,
  } = useEquipements();
  const { engins, chargement: chargementEn, erreur: erreurEn } = useEngins();
  const { filiales, onglets, filialeActive } = useFilialeTheme();
  // Valeurs des filtres ("" = pas de filtre).
  const [origineFiltre, setOrigineFiltre] = useState("");
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [graviteFiltre, setGraviteFiltre] = useState("");
  // { origine: "equipement" | "engin", id } : fiche ouverte par "Voir ...".
  const [fichierOuvert, setFichierOuvert] = useState(null);

  // Chargement ou erreur de l'une OU l'autre des deux sources de données.
  const chargement = chargementEq || chargementEn;
  const erreur = erreurEq || erreurEn;

  // Tous les groupes (pas seulement Fixe/Mobile) : ceux des types existants et
  // ceux de la table groupe_equipement (Données de base > Groupes).
  const groupesDisponibles = useMemo(() => {
    const set = new Set(["Fixe", "Mobile"]);
    typesEquipement.forEach((t) => t.categorie && set.add(t.categorie));
    groupesEquipement.forEach((g) => set.add(g.libelle));
    return Array.from(set);
  }, [typesEquipement, groupesEquipement]);

  // Toutes les réserves, recalculées seulement si les données changent.
  const toutes = useMemo(
    () => listerReserves(equipements, engins),
    [equipements, engins],
  );

  // Réserves après application des filtres, triées par délai de levée (la
  // plus proche en premier ; celles sans délai passent en premier aussi).
  const filtrees = useMemo(() => {
    return toutes
      .filter(({ origine, materiel, reserve }) => {
        if (origineFiltre && origine !== origineFiltre) return false;
        // Filiale choisie dans le menu latéral (sauf "Groupe" = toutes).
        if (
          filialeActive &&
          filialeActive !== "GROUPE" &&
          materiel.filiale?.code !== filialeActive
        )
          return false;
        // Filtre "filiale" propre à cette page.
        if (filialeFiltre && materiel.filiale?.code !== filialeFiltre)
          return false;
        if (
          categorieFiltre &&
          materiel.type_equipement?.categorie !== categorieFiltre
        )
          return false;
        if (
          typeFiltre &&
          String(materiel.id_type_equipement) !== String(typeFiltre)
        )
          return false;
        if (statutFiltre && reserve.statut !== statutFiltre) return false;
        if (graviteFiltre && reserve.niveau_criticite !== graviteFiltre)
          return false;
        return true;
      })
      .sort((a, b) =>
        (a.reserve.delai_levee ?? "") < (b.reserve.delai_levee ?? "") ? -1 : 1,
      );
  }, [
    toutes,
    origineFiltre,
    filialeActive,
    filialeFiltre,
    categorieFiltre,
    typeFiltre,
    statutFiltre,
    graviteFiltre,
  ]);

  return (
    <>
      {/* En-tête : titre et nombre de réserves affichées */}
      <div className="topbar">
        <div>
          <div className="eyebrow">Suivi des réserves</div>
          <h1 style={{ fontSize: "22px" }}>Réserves & Plan d'action</h1>
          <div
            style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}
          >
            {filtrees.length} réserve(s) filtrée(s)
          </div>
        </div>
      </div>

      <div className="content">
        {/* Barre de filtres : origine, filiale, groupe, type, statut, gravité */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div className="field" style={{ maxWidth: 180, marginBottom: 0 }}>
            <select
              value={origineFiltre}
              onChange={(e) => setOrigineFiltre(e.target.value)}
            >
              <option value="">Équipements & Engins</option>
              <option value="equipement">Équipements</option>
              <option value="engin">Engins</option>
            </select>
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

          <div className="field" style={{ maxWidth: 220, marginBottom: 0 }}>
            <select
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
            >
              <option value="">Tous les types</option>
              {typesEquipement.map((t) => (
                <option key={t.id_type_equipement} value={t.id_type_equipement}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ maxWidth: 180, marginBottom: 0 }}>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
            >
              <option value="">Tous statuts</option>
              <option value="Ouverte">Ouverte</option>
              <option value="En cours">En cours</option>
              <option value="Clôturée">Clôturée</option>
            </select>
          </div>

          <div className="field" style={{ maxWidth: 180, marginBottom: 0 }}>
            <select
              value={graviteFiltre}
              onChange={(e) => setGraviteFiltre(e.target.value)}
            >
              <option value="">Toute gravité</option>
              <option value="Mineure">Mineure</option>
              <option value="Majeure">Majeure</option>
              <option value="Critique">Critique</option>
            </select>
          </div>
        </div>

        {/* Erreur de chargement */}
        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}
          >
            {erreur}
          </Plate>
        )}

        {/* Trois cas : chargement en cours, aucun résultat, ou la liste des
            cartes (une carte par réserve) */}
        {chargement ? (
          <Plate style={{ padding: 16 }}>Chargement...</Plate>
        ) : filtrees.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              marginTop: 24,
            }}
          >
            Aucune réserve ne correspond à ces critères.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtrees.map(({ origine, cle, idMateriel, materiel, reserve }) => {
              const estEngin = origine === "engin";
              // En retard : réserve non clôturée dont le délai de levée est
              // dépassé.
              const enRetard =
                reserve.statut !== "Clôturée" &&
                reserve.delai_levee &&
                statutEcheance(reserve.delai_levee) === "retard";
              return (
                <Plate
                  key={cle}
                  style={{
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {/* Badges : statut, ENGIN (si engin), groupe, gravité,
                          filiale, retard */}
                      <Badge tone={STATUT_TONE[reserve.statut] ?? "warning"}>
                        {reserve.statut}
                      </Badge>
                      {estEngin && <Badge tone="warning">ENGIN</Badge>}
                      <Badge
                        tone={
                          materiel.type_equipement?.categorie === "Mobile"
                            ? "warning"
                            : "success"
                        }
                      >
                        {(
                          materiel.type_equipement?.categorie ??
                          (estEngin ? "Mobile" : "Fixe")
                        ).toUpperCase()}
                      </Badge>
                      <Badge
                        tone={
                          CRITICITE_TONE[reserve.niveau_criticite] ?? "warning"
                        }
                      >
                        {reserve.niveau_criticite}
                      </Badge>
                      <Badge tone="success">
                        {materiel.filiale?.code ?? "—"}
                      </Badge>
                      {enRetard && <Badge tone="danger">En retard</Badge>}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      {reserve.nature_reserve}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      <span className="ref">{idMateriel}</span>
                      {" — "}
                      {materiel.designation ?? "Sans désignation"}
                      {" — "}
                      {materiel.filiale?.libelle ?? "—"}
                      {" · Délai de levée : "}
                      <span className="mono">
                        {formaterDate(reserve.delai_levee)}
                      </span>
                    </div>
                  </div>

                  {/* Ouvre la fiche de l'équipement ou de l'engin concerné */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flexShrink: 0 }}
                    onClick={() =>
                      setFichierOuvert({ origine, id: idMateriel })
                    }
                  >
                    {estEngin ? "Voir engin" : "Voir équipement"}
                  </button>
                </Plate>
              );
            })}
          </div>
        )}
      </div>

      {/* Fiche détaillée ouverte par "Voir ..." (selon l'origine) */}
      {fichierOuvert?.origine === "equipement" && (
        <EquipementModal
          id={fichierOuvert.id}
          onClose={() => setFichierOuvert(null)}
        />
      )}
      {fichierOuvert?.origine === "engin" && (
        <EnginModal
          id={fichierOuvert.id}
          onClose={() => setFichierOuvert(null)}
        />
      )}
    </>
  );
}
