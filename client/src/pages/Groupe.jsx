import Plate from '../components/Plate';
import Badge from '../components/Badge';
import Gauge from '../components/Gauge';
import { FILIALES } from '../data/mockData';

// Objectif 6 du CDC : "tableaux de bord de pilotage par filiale et consolidés Groupe".
export default function Groupe() {
  const moyenne = Math.round(FILIALES.reduce((s, f) => s + f.taux, 0) / FILIALES.length);
  const pire = FILIALES.reduce((a, b) => (b.taux < a.taux ? b : a));
  const meilleure = FILIALES.reduce((a, b) => (b.taux > a.taux ? b : a));

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Toutes filiales</div>
          <h1 style={{ fontSize: '22px' }}>Vue consolidée Groupe</h1>
        </div>
        <button className="btn btn-secondary">Exporter le rapport Groupe</button>
      </div>

      <div className="content">
        <div className="hero-row">
          <Plate style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Gauge percent={moyenne} />
              <div className="gauge-label" style={{ marginTop: 8 }}>Conformité moyenne Groupe</div>
              <div className="stat-sub" style={{ marginTop: 2 }}>{FILIALES.length} filiales</div>
            </div>
          </Plate>
          <div className="stat-row">
            <Plate>
              <div style={{ padding: '16px 18px' }}>
                <div className="stat-label">Réserves ouvertes (Groupe)</div>
                <div className="stat-value">{FILIALES.reduce((s, f) => s + f.ouvertes, 0)}</div>
                <div className="stat-sub">dont {FILIALES.reduce((s, f) => s + f.retard, 0)} en retard</div>
              </div>
            </Plate>
            <Plate>
              <div style={{ padding: '16px 18px' }}>
                <div className="stat-label">Filiale la plus exposée</div>
                <div className="stat-value" style={{ color: 'var(--danger)', fontSize: 22 }}>{pire.code}</div>
                <div className="stat-sub">{pire.taux} % de conformité</div>
              </div>
            </Plate>
            <Plate>
              <div style={{ padding: '16px 18px' }}>
                <div className="stat-label">Filiale la mieux notée</div>
                <div className="stat-value" style={{ color: 'var(--success)', fontSize: 22 }}>{meilleure.code}</div>
                <div className="stat-sub">{meilleure.taux} % de conformité</div>
              </div>
            </Plate>
          </div>
        </div>

        <Plate>
          <div className="panel-header"><div className="panel-title">Comparatif inter-sites</div></div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Filiale</th><th>Taux de conformité</th><th>Réserves ouvertes</th><th>En retard</th></tr>
              </thead>
              <tbody>
                {FILIALES.map((f) => (
                  <tr key={f.code}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{f.nom}</div>
                      <div className="ref">{f.code}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 120, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${f.taux}%`,
                              height: '100%',
                              background: f.taux >= 90 ? 'var(--success)' : f.taux >= 80 ? 'var(--gold)' : 'var(--danger)',
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: 12.5 }}>{f.taux}%</span>
                      </div>
                    </td>
                    <td>{f.ouvertes}</td>
                    <td>{f.retard > 0 ? <Badge tone="danger">{f.retard}</Badge> : <Badge tone="success">0</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Plate>
      </div>
    </>
  );
}
