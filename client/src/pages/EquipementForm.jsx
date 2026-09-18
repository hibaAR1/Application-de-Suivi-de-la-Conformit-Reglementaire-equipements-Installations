import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Plate from '../components/Plate';
import { useEquipements, TYPES_EQUIPEMENT, FILIALES_CODES, STATUTS_EQUIPEMENT, PERIODICITE_PAR_DEFAUT } from '../context/EquipementsContext';

// §3.1 du CDC — tous les champs obligatoires de la "fiche équipement",
// sauf Identifiant et QR code qui sont générés automatiquement (non saisis ici).
export default function EquipementForm() {
  const { ref } = useParams(); // présent = modification, absent = création
  const navigate = useNavigate();
  const { getByRef, creerEquipement, modifierEquipement } = useEquipements();
  const existant = ref ? getByRef(ref) : null;

  const [form, setForm] = useState(
    existant ?? {
      filiale: 'CTM',
      typeEquipement: TYPES_EQUIPEMENT[0],
      designation: '',
      marqueModele: '',
      numeroSerie: '',
      dateMiseEnService: '',
      periodiciteControle: PERIODICITE_PAR_DEFAUT[TYPES_EQUIPEMENT[0]],
      statut: 'En service',
    },
  );
  const [erreurs, setErreurs] = useState({});

  function setChamp(champ, valeur) {
    setForm((f) => {
      const next = { ...f, [champ]: valeur };
      // §3.1 : la périodicité est déterminée selon le type — on la resuggère au changement de type,
      // sans écraser une valeur que l'utilisateur aurait déjà personnalisée manuellement après coup.
      if (champ === 'typeEquipement' && !existant) {
        next.periodiciteControle = PERIODICITE_PAR_DEFAUT[valeur];
      }
      return next;
    });
  }

  function valider() {
    const e = {};
    if (!form.designation.trim()) e.designation = 'Champ obligatoire.';
    if (form.designation.length > 100) e.designation = '100 caractères maximum.';
    if (!form.numeroSerie.trim()) e.numeroSerie = 'Champ obligatoire.';
    if (!form.dateMiseEnService) e.dateMiseEnService = 'Champ obligatoire.';
    if (!form.periodiciteControle || form.periodiciteControle <= 0) e.periodiciteControle = 'Doit être un nombre de mois positif.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!valider()) return;
    if (existant) {
      modifierEquipement(ref, form);
      navigate(`/equipements/${ref}`);
    } else {
      const cree = creerEquipement(form);
      navigate(`/equipements/${cree.ref}`);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">{existant ? existant.ref : 'Nouvel équipement'}</div>
          <h1 style={{ fontSize: '22px' }}>{existant ? 'Modifier la fiche' : 'Créer un équipement'}</h1>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 640 }}>
        <Plate style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label htmlFor="filiale">Filiale / Site</label>
                <select id="filiale" value={form.filiale} onChange={(e) => setChamp('filiale', e.target.value)}>
                  {FILIALES_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="type">Type d'équipement</label>
                <select id="type" value={form.typeEquipement} onChange={(e) => setChamp('typeEquipement', e.target.value)}>
                  {TYPES_EQUIPEMENT.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="designation">Désignation (100 caractères max)</label>
              <input
                id="designation" type="text" maxLength={100} value={form.designation}
                onChange={(e) => setChamp('designation', e.target.value)}
              />
              {erreurs.designation && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{erreurs.designation}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label htmlFor="marque">Marque / Modèle</label>
                <input id="marque" type="text" value={form.marqueModele} onChange={(e) => setChamp('marqueModele', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="serie">Numéro de série constructeur</label>
                <input id="serie" type="text" value={form.numeroSerie} onChange={(e) => setChamp('numeroSerie', e.target.value)} />
                {erreurs.numeroSerie && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{erreurs.numeroSerie}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label htmlFor="mes">Date de mise en service</label>
                <input id="mes" type="date" value={form.dateMiseEnService} onChange={(e) => setChamp('dateMiseEnService', e.target.value)} />
                {erreurs.dateMiseEnService && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{erreurs.dateMiseEnService}</span>}
              </div>
              <div className="field">
                <label htmlFor="periodicite">Périodicité de contrôle (mois)</label>
                <input
                  id="periodicite" type="number" min="1" value={form.periodiciteControle}
                  onChange={(e) => setChamp('periodiciteControle', Number(e.target.value))}
                />
                {erreurs.periodiciteControle && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{erreurs.periodiciteControle}</span>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="statut">Statut</label>
              <select id="statut" value={form.statut} onChange={(e) => setChamp('statut', e.target.value)}>
                {STATUTS_EQUIPEMENT.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 18 }}>
              L'identifiant et le QR code sont générés automatiquement à l'enregistrement (§3.1).
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">
                {existant ? 'Enregistrer les modifications' : 'Créer l\'équipement'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Annuler</button>
            </div>
          </form>
        </Plate>
      </div>
    </>
  );
}
