import ExcelJS from "exceljs";

// A, B, C... jusqu'à la colonne d'index donné (0 = A). Largement suffisant
// ici (moins de 26 colonnes).
function lettreColonne(index) {
  return String.fromCharCode(65 + index);
}

// Construit et télécharge un classeur .xlsx vierge (juste les libellés de
// colonnes, aucune donnée) avec de vraies listes déroulantes Excel (validation
// de données) sur certaines colonnes, remplies avec les valeurs réelles de
// l'application. Évite les fautes de frappe qui empêchent l'import de
// retrouver la bonne filiale/le bon type ensuite.
//
// `listes` : { "Nom de colonne (tel qu'il apparaît dans `colonnes`)": [valeurs...] }
// — la colonne est retrouvée par son nom, pas par une lettre fixe, pour
// pouvoir réordonner/ajouter des colonnes sans casser les validations.
export async function telechargerCanevasXlsx({
  colonnes,
  listes: listesParColonne,
  nomFichier = "canevas-equipements.xlsx",
}) {
  const classeur = new ExcelJS.Workbook();
  const feuille = classeur.addWorksheet("Équipements");
  const listes = classeur.addWorksheet("Listes");
  listes.state = "hidden";

  feuille.addRow(colonnes);
  feuille.getRow(1).font = { bold: true };
  feuille.columns = colonnes.map(() => ({ width: 24 }));

  // Feuille cachée : une colonne par liste de choix (référencée par les
  // validations de données ci-dessous), dans l'ordre de `listesParColonne`.
  const entrees = Object.entries(listesParColonne);
  entrees.forEach(([, valeurs], i) => {
    valeurs.forEach((v, ligne) => {
      listes.getCell(ligne + 1, i + 1).value = v;
    });
  });

  const plage = (lettre, longueur) =>
    `Listes!$${lettre}$1:$${lettre}$${Math.max(longueur, 1)}`;

  const NB_LIGNES = 300; // lignes vierges avec liste déroulante, à remplir
  for (let ligne = 2; ligne <= NB_LIGNES; ligne++) {
    entrees.forEach(([nomColonne, valeurs], i) => {
      const indexColonneCible = colonnes.indexOf(nomColonne);
      if (indexColonneCible === -1) return;
      feuille.getCell(
        `${lettreColonne(indexColonneCible)}${ligne}`,
      ).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [plage(lettreColonne(i), valeurs.length)],
      };
    });
  }

  const buffer = await classeur.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Lit un fichier .xlsx importé et renvoie un tableau de lignes de données
// (tableaux de chaînes), sans la ligne d'en-tête, sans lignes vides.
export async function lireXlsxEquipements(fichier) {
  const classeur = new ExcelJS.Workbook();
  const buffer = await fichier.arrayBuffer();
  await classeur.xlsx.load(buffer);
  const feuille = classeur.worksheets[0];
  const lignes = [];

  feuille.eachRow((row, numeroLigne) => {
    if (numeroLigne === 1) return; // en-tête
    const valeurs = row.values.slice(1).map((v) => {
      if (v === null || v === undefined) return "";
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      if (typeof v === "object" && "result" in v) return String(v.result ?? "");
      if (typeof v === "object" && "text" in v) return String(v.text ?? "");
      return String(v);
    });
    if (valeurs.some((v) => v.trim() !== "")) {
      lignes.push({ numeroLigne, valeurs });
    }
  });
  return lignes;
}
