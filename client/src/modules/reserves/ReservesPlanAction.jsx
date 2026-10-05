import { useMemo, useState } from "react";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import EquipementModal from "../equipements/EquipementModal";
import { useEquipements } from "../../context/EquipementsContext";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { statutEcheance } from "../dashboard/utils/echeance";

const CRITICITE_TONE = {
  Mineure: "success",
  Majeure: "warning",
  Critique: "danger",
};
const STATUT_TONE = {
  Ouverte: "warning",
  "En cours": "warning",
  Clôturée: "success",
};

function formaterDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

// Aplatit équipements -> contrôles -> réserves en une seule liste de cartes,
// pour pouvoir filtrer/afficher toutes les réserves ensemble peu importe
// l'équipement ou le contrôle d'origine. Tout vient des équipements déjà
// chargés en base (EquipementsContext, alimenté par /donnees-initiales) :
// aucune donnée locale/mockée, comme demandé.
function listerReserves(equipements) {
  const liste = [];
  for (const eq of equipements) {
    for (const c of eq.controles ?? []) {
      for (const r of c.reserves ?? []) {
        liste.push({ equipement: eq, controle: c, reserve: r });
      }
    }
  }
  return liste;
}

export default function ReservesPlanAction() {
  const { equipements, chargement, erreur } = useEquipements();
  const { filiales, onglets, filialeActive } = useFilialeTheme();
  const [filialeFiltre, setFilialeFiltre] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");
  const [graviteFiltre, setGraviteFiltre] = useState("");
  const [fichierOuvert, setFichierOuvert] = useState(null);

  const toutes = useMemo(() => listerReserves(equipements), [equipements]);

  const filtrees = useMemo(() => {
    return toutes
      .filter(({ equipement, reserve }) => {
        if (
          filialeActive &&
          filialeActive !== "GROUPE" &&
          equipement.filiale?.code !== filialeActive
        )
          return false;
        if (filialeFiltre && equipement.filiale?.code !== filialeFiltre)
          return false;
        if (
          categorieFiltre &&
          equipement.type_equipement?.categorie !== categorieFiltre
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
    filialeActive,
    filialeFiltre,
    categorieFiltre,
    statutFiltre,
    graviteFiltre,
  ]);

  return (
    <>
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
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
              <option value="">Fixes & Mobiles</option>
              <option value="Fixe">Fixes</option>
              <option value="Mobile">Mobiles</option>
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

        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}
          >
            {erreur}
          </Plate>
        )}

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
            {filtrees.map(({ equipement, reserve }) => {
              const enRetard =
                reserve.statut !== "Clôturée" &&
                reserve.delai_levee &&
                statutEcheance(reserve.delai_levee) === "retard";
              return (
                <Plate
                  key={reserve.id_reserve}
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
                      <Badge tone={STATUT_TONE[reserve.statut] ?? "warning"}>
                        {reserve.statut}
                      </Badge>
                      <Badge
                        tone={
                          equipement.type_equipement?.categorie === "Mobile"
                            ? "warning"
                            : "success"
                        }
                      >
                        {equipement.type_equipement?.categorie === "Mobile"
                          ? "MOBILE"
                          : "FIXE"}
                      </Badge>
                      <Badge
                        tone={
                          CRITICITE_TONE[reserve.niveau_criticite] ?? "warning"
                        }
                      >
                        {reserve.niveau_criticite}
                      </Badge>
                      <Badge tone="success">
                        {equipement.filiale?.code ?? "—"}
                      </Badge>
                      {enRetard && <Badge tone="danger">En retard</Badge>}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      {reserve.nature_reserve}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      <span className="ref">{equipement.id_equipement}</span>
                      {" — "}
                      {equipement.designation ?? "Sans désignation"}
                      {" — "}
                      {equipement.filiale?.libelle ?? "—"}
                      {" · Délai de levée : "}
                      <span className="mono">
                        {formaterDate(reserve.delai_levee)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flexShrink: 0 }}
                    onClick={() => setFichierOuvert(equipement.id_equipement)}
                  >
                    Voir équipement
                  </button>
                </Plate>
              );
            })}
          </div>
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
