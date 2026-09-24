// Page de test manuel de l'API (n'est reliée à aucune route dans App.jsx
// actuellement — pas utilisée en production). Gardée ici, à part des
// vrais modules métier, au cas où elle resservirait pour déboguer l'API
// en local.
import { useEffect, useState } from "react";

function TestApi() {
  const [filiales, setFiliales] = useState([]);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/filiales")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur API : " + res.status);
        return res.json();
      })
      .then(setFiliales)
      .catch((err) => setErreur(err.message));
  }, []);

  if (erreur) return <p style={{ color: "red" }}>Erreur : {erreur}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Test API — Filiales</h2>
      <ul>
        {filiales.map((f) => (
          <li key={f.id_filiale}>
            {f.libelle} ({f.code})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TestApi;
