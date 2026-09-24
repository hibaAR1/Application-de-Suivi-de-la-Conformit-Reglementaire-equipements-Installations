import { useState } from "react";
import Plate from "../../components/Plate";
import NouveauTypeModal from "./NouveauTypeModal";
import { useAuth } from "../../context/AuthContext";
import { useEquipements } from "../../context/EquipementsContext";

export default function TypesEquipementAdmin() {
  const { user } = useAuth();
  const { typesEquipement, equipements, supprimerTypeEquipement } =
    useEquipements();
  const [modalOuverte, setModalOuverte] = useState(false);
  const [typeEdite, setTypeEdite] = useState(null);
  const [erreur, setErreur] = useState("");

  if (!user?.hasPermission("utilisateurs.manage")) {
    return (
      <div className="content">
        <Plate style={{ padding: 24 }}>
          Accès refusé — cette page est réservée aux administrateurs.
        </Plate>
      </div>
    );
  }

  async function supprimer(type) {
    if (!window.confirm(`Supprimer le type "${type.libelle}" ?`)) return;
    setErreur("");
    try {
      await supprimerTypeEquipement(type.id_type_equipement);
    } catch (e) {
      // Le serveur refuse (422) si des équipements utilisent encore ce type.
      setErreur(e.message);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Données de base / Types d'équipement</div>
          <h1 style={{ fontSize: "22px" }}>Types d'équipement</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setTypeEdite(null);
            setModalOuverte(true);
          }}
        >
          + Nouveau type
        </button>
      </div>

      <div className="content">
        {erreur && (
          <Plate
            style={{ padding: 16, color: "var(--danger)", marginBottom: 12 }}
          >
            {erreur}
          </Plate>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {typesEquipement.map((t) => {
            const nbEquipements = equipements.filter(
              (e) => e.id_type_equipement === t.id_type_equipement,
            ).length;
            return (
              <Plate key={t.id_type_equipement} style={{ padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <h2 style={{ fontSize: 15 }}>{t.libelle}</h2>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      title="Modifier"
                      style={{ padding: "4px 8px" }}
                      onClick={() => {
                        setTypeEdite(t);
                        setModalOuverte(true);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      title="Supprimer"
                      style={{ padding: "4px 8px", color: "var(--danger)" }}
                      onClick={() => supprimer(t)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Périodicité : {t.periodicite_controle} mois · Groupe :{" "}
                  {t.categorie}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {nbEquipements} équipement(s)
                </div>
              </Plate>
            );
          })}
        </div>
      </div>

      {modalOuverte && (
        <NouveauTypeModal
          typeExistant={typeEdite}
          onClose={() => setModalOuverte(false)}
        />
      )}
    </>
  );
}
