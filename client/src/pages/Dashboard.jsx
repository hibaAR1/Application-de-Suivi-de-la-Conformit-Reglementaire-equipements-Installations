import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Plate from '../components/Plate';
import Badge from '../components/Badge';
import Gauge from '../components/Gauge';
import { IconQr } from '../components/icons';
import { useControles } from '../context/ControlesContext';
import { useEquipements } from '../context/EquipementsContext';
import { statutEcheance, formatDateFR } from '../utils/echeance';

const STATUT_BADGE = {
  retard: <Badge tone="danger">Retard</Badge>,
  j0: <Badge tone="danger">J-0</Badge>,
  j15: <Badge tone="warning">J-15</Badge>,
  j30: <Badge tone="success">J-30</Badge>,
  ok: <Badge tone="success">À jour</Badge>,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { controles } = useControles();
  const { equipements, getByRef } = useEquipements();

  // §3.2 : le moteur d'alertes se base sur la "prochaine échéance" de chaque équipement —
  // on prend ici le contrôle le plus récent par équipement (donnée réelle du magasin, pas figée).
  const echeances = useMemo(() => {
    const parEquipement = new Map();
    for (const c of controles) {
      const actuel = parEquipement.get(c.equipementRef);
      if (!actuel || c.dateControle > actuel.dateControle) parEquipement.set(c.equipementRef, c);
    }
    return [...parEquipement.values()]
      .map((c) => ({ ...c, statut: statutEcheance(c.prochaineEcheance) }))
      .filter((c) => c.statut !== 'ok')
      .sort((a, b) => (a.prochaineEcheance < b.prochaineEcheance ? -1 : 1));
  }, [controles]);

  const reservesOuvertes = useMemo(
    () => controles.filter((c) => c.reserve && c.reserve.statut !== 'Levée'),
    [controles],
  );
  const enRetard = echeances.filter((e) => e.statut === 'retard');
  const tauxConformite = useMemo(() => {
    if (equipements.length === 0) return 100;
    const enDefaut = new Set(reservesOuvertes.filter((r) => r.reserve.criticite === 'Bloquante').map((r) => r.equipementRef));
    return Math.round(((equipements.length - enDefaut.size) / equipements.length) * 100);
  }, [equipements, reservesOuvertes]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Filiale CTM</div>
          <h1 style={{ fontSize: '22px' }}>Tableau de bord</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/scanner')}>
          <IconQr /> Scanner un équipement
        </button>
      </div>

      <div className="content">
        <div className="hero-row">
          <Plate style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Gauge percent={tauxConformite} />
              <div className="gauge-label" style={{ marginTop: 8 }}>Taux de conformité</div>
              <div className="stat-sub" style={{ marginTop: 2 }}>{equipements.length} équipements suivis</div>
            </div>
          </Plate>
          <div className="stat-row">
            <Plate>
              <div style={{ padding: '16px 18px' }}>
                <div className="stat-label">Réserves ouvertes</div>
                <div className="stat-value">{reservesOuvertes.length}</div>
                <div className="stat-sub">dont {reservesOuvertes.filter((r) => r.reserve.criticite === 'Bloquante').length} bloquante(s)</div>
              </div>
            </Plate>
            <Plate>
              <div style={{ padding: '16px 18px' }}>
                <div className="stat-label">En retard</div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>{enRetard.length}</div>
                <div className="stat-sub ref">{enRetard[0]?.equipementRef ?? '—'}</div>
              </div>
            </Plate>
            <Plate>
              <div style={{ padding: '16px 18px' }}>
                <div className="stat-label">Échéances ≤ 30j</div>
                <div className="stat-value" style={{ color: 'var(--gold)' }}>{echeances.length}</div>
                <div className="stat-sub">contrôles à planifier</div>
              </div>
            </Plate>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
          <Plate>
            <div className="panel-header">
              <div className="panel-title">Prochaines échéances</div>
              <button className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '6px 12px' }}>Exporter</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Équipement</th><th>Type</th><th>Échéance</th><th>Statut</th></tr></thead>
                <tbody>
                  {echeances.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune échéance à venir.</td></tr>
                  ) : echeances.map((e) => {
                    const eq = getByRef(e.equipementRef);
                    return (
                      <tr key={e.equipementRef} className="rowlink" onClick={() => navigate(`/equipements/${e.equipementRef}`)}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{eq?.designation ?? e.equipementRef}</div>
                          <div className="ref">{e.equipementRef}</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{eq?.typeEquipement}</td>
                        <td className="mono">{formatDateFR(e.prochaineEcheance)}</td>
                        <td>{STATUT_BADGE[e.statut]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Plate>

          <Plate>
            <div className="panel-header"><div className="panel-title">Réserves à traiter</div></div>
            <div style={{ padding: '6px 4px' }}>
              {reservesOuvertes.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Aucune réserve ouverte.</div>
              ) : reservesOuvertes.map((r, i) => (
                <div
                  key={r.id} className="rowlink"
                  onClick={() => navigate(`/equipements/${r.equipementRef}`)}
                  style={{ padding: '12px 16px', borderBottom: i < reservesOuvertes.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div className="ref">{r.equipementRef}</div>
                    <Badge tone={r.reserve.criticite === 'Bloquante' ? 'danger' : r.reserve.criticite === 'Majeure' ? 'warning' : 'success'}>
                      {r.reserve.criticite} · {r.reserve.statut}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{r.reserve.nature}</div>
                </div>
              ))}
            </div>
          </Plate>
        </div>
      </div>
    </>
  );
}
