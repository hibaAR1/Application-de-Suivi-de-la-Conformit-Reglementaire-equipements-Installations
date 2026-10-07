import { useMemo } from "react";
import Plate from "../../components/Plate";
import Badge from "../../components/Badge";
import { useFilialeTheme } from "../../context/FilialeThemeContext";
import { useEquipements } from "../../context/EquipementsContext";
import { useEngins } from "../../context/EnginsContext";

// Tableau de bord UNIQUE du groupe : équipements fixes (table "equipement") et
// engins mobiles (table "engin") ensemble. Les deux tables restent séparées en
// base ; seul cet écran les rassemble.

const COULEUR_ENGIN = "#6B4FA0";
const COULEUR_FIXE = "#1F7A5A";

// Nombre de réserves non clôturées d'un équipement ou d'un engin.
function reservesNonCloturees(item) {
  return (item.controles ?? []).flatMap((c) =>
    (c.reserves ?? []).filter((r) => r.statut !== "Clôturée"),
  );
}

function estControle(item) {
  return (item.controles ?? []).length > 0;
}

// Compte les éléments par libellé de type, du plus fréquent au moins fréquent.
function compterParType(liste) {
  const compte = new Map();
  for (const item of liste) {
    const libelle = item.type_equipement?.libelle ?? "Sans type";
    compte.set(libelle, (compte.get(libelle) ?? 0) + 1);
  }
  return [...compte.entries()].sort((a, b) => b[1] - a[1]);
}

function CarteChiffre({ couleur, valeur, titre, sousTitre }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${couleur}`,
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, color: couleur }}>
        {valeur}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>
        {titre}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
        {sousTitre}
      </div>
    </div>
  );
}

function BarreProgression({ pourcent, couleur }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pourcent}%`,
            height: "100%",
            background: couleur,
          }}
        />
      </div>
      <span
        className="mono"
        style={{ fontSize: 11.5, color: "var(--text-muted)", minWidth: 32 }}
      >
        {pourcent}%
      </span>
    </div>
  );
}

function PanneauRepartition({ titre, lignes, couleur }) {
  const max = Math.max(1, ...lignes.map(([, n]) => n));
  return (
    <Plate>
      <div className="panel-header">
        <div className="panel-title">{titre}</div>
      </div>
      <div style={{ padding: "6px 18px 14px" }}>
        {lignes.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Aucune donnée.
          </div>
        ) : (
          lignes.map(([libelle, nombre]) => (
            <div
              key={libelle}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "5px 0",
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>{libelle}</div>
              <div
                style={{
                  width: 90,
                  height: 5,
                  borderRadius: 3,
                  background: "var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(nombre / max) * 100}%`,
                    height: "100%",
                    background: couleur,
                  }}
                />
              </div>
              <div
                className="mono"
                style={{
                  width: 34,
                  textAlign: "right",
                  fontWeight: 700,
                  color: couleur,
                }}
              >
                {nombre}
              </div>
            </div>
          ))
        )}
      </div>
    </Plate>
  );
}

export default function Dashboard() {
  const { filialeActive, filiales: filialesTheme } = useFilialeTheme();
  const {
    equipements,
    filiales,
    chargement: chargementEquipements,
  } = useEquipements();
  const { engins, chargement: chargementEngins } = useEngins();

  const filialeFiltree = filialeActive && filialeActive !== "GROUPE";

  // Équipements "fixes" : tout ce qui n'est pas de catégorie "Mobile" dans la
  // table equipement (les mobiles sont dans la table engin).
  const fixes = useMemo(
    () =>
      equipements.filter(
        (e) =>
          e.type_equipement?.categorie !== "Mobile" &&
          (!filialeFiltree || e.filiale?.code === filialeActive),
      ),
    [equipements, filialeFiltree, filialeActive],
  );
  const mobiles = useMemo(
    () =>
      engins.filter(
        (e) => !filialeFiltree || e.filiale?.code === filialeActive,
      ),
    [engins, filialeFiltree, filialeActive],
  );

  const tous = useMemo(() => [...fixes, ...mobiles], [fixes, mobiles]);
  const nbControles = tous.filter(estControle).length;
  const nbControlesFixes = fixes.filter(estControle).length;
  const nbControlesMobiles = mobiles.filter(estControle).length;
  const reservesOuvertes = useMemo(
    () => tous.flatMap((item) => reservesNonCloturees(item)),
    [tous],
  );
  const reservesCritiques = reservesOuvertes.filter(
    (r) => r.niveau_criticite === "Critique",
  ).length;
  const pourcentParc = tous.length
    ? Math.round((nbControles / tous.length) * 100)
    : 0;

  // Une ligne par filiale (ou seulement la filiale active).
  const lignesFiliales = useMemo(() => {
    return filiales
      .filter((f) => !filialeFiltree || f.code === filialeActive)
      .map((f) => {
        const fx = fixes.filter((e) => e.filiale?.code === f.code);
        const mb = mobiles.filter((e) => e.filiale?.code === f.code);
        const total = fx.length + mb.length;
        const controles = [...fx, ...mb].filter(estControle).length;
        const reserves = [...fx, ...mb].flatMap((i) => reservesNonCloturees(i));
        return {
          filiale: f,
          fixes: fx.length,
          mobiles: mb.length,
          total,
          controles,
          reserves: reserves.length,
          critiques: reserves.filter((r) => r.niveau_criticite === "Critique")
            .length,
          avancement: total ? Math.round((controles / total) * 100) : 0,
        };
      })
      .filter((l) => l.total > 0);
  }, [filiales, fixes, mobiles, filialeFiltree, filialeActive]);

  const libelleFiliale = filialeFiltree
    ? (filialesTheme.find((f) => f.code === filialeActive)?.libelle ??
      `Filiale ${filialeActive}`)
    : "Toutes filiales";

  const enChargement = chargementEquipements || chargementEngins;

  return (
    <>
      <div className="topbar">
        <div>
          <h1 style={{ fontSize: "22px" }}>Tableau de bord — Groupe Ménara</h1>
          <div
            style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}
          >
            Contrôle réglementaire — Équipements fixes & Engins mobiles —{" "}
            {libelleFiliale}
          </div>
        </div>
      </div>

      <div className="content">
        {enChargement ? (
          <Plate style={{ padding: 16 }}>Chargement...</Plate>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <CarteChiffre
                couleur="var(--bordeaux)"
                valeur={tous.length}
                titre="Total équipements"
                sousTitre={`${mobiles.length} mobiles / ${fixes.length} fixes`}
              />
              <CarteChiffre
                couleur={COULEUR_ENGIN}
                valeur={mobiles.length}
                titre="Engins mobiles"
                sousTitre={`${nbControlesMobiles} contrôlés`}
              />
              <CarteChiffre
                couleur={COULEUR_FIXE}
                valeur={fixes.length}
                titre="Équipements fixes"
                sousTitre={`${nbControlesFixes} contrôlés`}
              />
              <CarteChiffre
                couleur="var(--success)"
                valeur={nbControles}
                titre="Contrôlés"
                sousTitre={`${pourcentParc}% du parc`}
              />
              <CarteChiffre
                couleur="var(--gold)"
                valeur={reservesOuvertes.length}
                titre="Réserves ouvertes"
                sousTitre="toutes gravités"
              />
              <CarteChiffre
                couleur="var(--danger)"
                valeur={reservesCritiques}
                titre="Réserves critiques"
                sousTitre="priorité urgente"
              />
            </div>

            <Plate style={{ marginBottom: 18 }}>
              <div className="panel-header">
                <div className="panel-title">Récapitulatif par filiale</div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Filiale</th>
                      <th>Fixes</th>
                      <th>Mobiles</th>
                      <th>Total</th>
                      <th>Contrôlés</th>
                      <th>Réserves</th>
                      <th>Avancement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesFiliales.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          Aucun équipement ni engin à afficher.
                        </td>
                      </tr>
                    ) : (
                      lignesFiliales.map((l) => (
                        <tr key={l.filiale.code}>
                          <td>
                            <div style={{ fontWeight: 700 }}>
                              {l.filiale.libelle}
                            </div>
                            <div className="ref">{l.filiale.code}</div>
                          </td>
                          <td>{l.fixes}</td>
                          <td>{l.mobiles}</td>
                          <td style={{ fontWeight: 800 }}>{l.total}</td>
                          <td
                            className="mono"
                            style={{ fontWeight: 700, color: "var(--gold)" }}
                          >
                            {l.controles}/{l.total}
                          </td>
                          <td>
                            {l.reserves === 0 ? (
                              <Badge tone="success">Conforme</Badge>
                            ) : (
                              <Badge
                                tone={l.critiques > 0 ? "danger" : "warning"}
                              >
                                {l.reserves} ouverte(s)
                              </Badge>
                            )}
                          </td>
                          <td style={{ minWidth: 180 }}>
                            <BarreProgression
                              pourcent={l.avancement}
                              couleur="var(--success)"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Plate>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              <PanneauRepartition
                titre="Engins mobiles par catégorie"
                lignes={compterParType(mobiles)}
                couleur={COULEUR_ENGIN}
              />
              <PanneauRepartition
                titre="Équipements fixes par type"
                lignes={compterParType(fixes)}
                couleur={COULEUR_FIXE}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
