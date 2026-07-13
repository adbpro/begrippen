function csvToJsonLD(csvText) {

  // -----------------------------
  // 1. CSV parser
  // -----------------------------
function parseCSV(text) {
  const result = Papa.parse(text, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true
  });
  return result.data;
}

  // -----------------------------
  // 2. Helpers
  // -----------------------------
  function sanitize(str) {
    if (!str) return "zonder-naam";
    return String(str)
      .toLowerCase()
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function splitMulti(str) {
    if (!str) return [];
    return str.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  }

  const base = "https://begrippen.prorail.nl/";

  function conceptURI(inKader, term) {
    const scheme = sanitize(inKader || "spoorse-begrippen");
    const concept = sanitize(term || "geen-naam");
    return base + scheme + "/id/begrip/" + concept;
  }

  function addRelation(node, prop, raw, inKader) {
    if (!raw) return;
    const values = splitMulti(raw);
    const uris = values.map(v => conceptURI(inKader, v));
    if (!node[prop]) node[prop] = [];
    node[prop].push(...uris);
  }

  // SKOS property types that need a symmetric reverse
  const symmetricReverse = {
    "skos:broader": "skos:narrower",
    "skos:narrower": "skos:broader",
    "skos:related": "skos:related"
  };

  // -----------------------------
  // 3. Conversion per row
  // -----------------------------
  function convertRow(row) {
    const inKader = row["in kader"] || "spoorse-begrippen";
    const uri = conceptURI(inKader, row["voorkeursterm"]);

    const node = {
      "@id": uri,
      "@type": "skos:Concept",
      "skos:prefLabel": row["voorkeursterm"] || undefined,
      "skos:definition": row["definitie"] || undefined
    };

    // labels
   // ---- ALT LABELS ALS RELATIE ----
if (row["alternatieve term"]) {
  splitMulti(row["alternatieve term"]).forEach(alt => {
    const altUri = conceptURI(inKader, alt);  // genereer URI zoals bij andere relaties
    if (!node["skos:altLabel"]) node["skos:altLabel"] = [];
    node["skos:altLabel"].push(altUri);
  });
}

    if (row["zoekterm"])
      node["skos:hiddenLabel"] = splitMulti(row["zoekterm"]);

    // basic SKOS relations
    addRelation(node, "skos:broader", row["heeft bovenliggend begrip"], inKader);
    addRelation(node, "skos:narrower", row["heeft onderliggend begrip"], inKader);
    addRelation(node, "skos:related", row["is gerelateerd aan"], inKader);

    // extended mapping
    const relationMap = {      
      "heeft overeenkomstig bovenliggend": "skos:broaderMatch",
      "heeft overeenkomstig onderliggend": "skos:narrowerMatch",
      "is vrijwel overeenkomstig": "skos:closeMatch",
      "is exact overeenkomstig": "skos:exactMatch",
      "is overeenkomstig verwant": "skos:relatedMatch",

      // These must produce symmetric broader/narrower
      "is specialisatie van": "skos:broader",
      "is generalisatie van": "skos:narrower",
      "is onderdeel van": "skos:broader",
      "omvat": "skos:narrower",
      "is exemplaar van": "skos:broader",
      "is categorie van": "skos:narrower"
    };

    for (const col in relationMap) {
      addRelation(node, relationMap[col], row[col], inKader);
    }

    // metadata
    if (row["heeft bron"]) node["dct:source"] = row["heeft bron"];
    if (row["toelichting"]) node["dct:description"] = row["toelichting"];
    if (row["voorbeeld"]) node["skos:example"] = row["voorbeeld"];

    return node;
  }

  // -----------------------------
  // 4. First pass – create all nodes
  // -----------------------------
  const rows = parseCSV(csvText);
  const graph = rows.map(convertRow);

  // Create lookup table
  const lookup = new Map();
  graph.forEach(node => lookup.set(node["@id"], node));

  // -----------------------------
  // 5. Second pass – add symmetric sides
  // -----------------------------
  graph.forEach(node => {
    for (const prop in symmetricReverse) {
      const reverseProp = symmetricReverse[prop];
      const targets = node[prop] || [];

      targets.forEach(targetUri => {
        const targetNode = lookup.get(targetUri);
        if (!targetNode) return;

        if (!targetNode[reverseProp]) targetNode[reverseProp] = [];

        // Avoid duplicates
        if (!targetNode[reverseProp].includes(node["@id"])) {
          targetNode[reverseProp].push(node["@id"]);
        }
      });
    }
  });

  // -----------------------------
  // 6. Return JSON-LD
  // -----------------------------
console.log(
{
    "@context": {
      "skos": "http://www.w3.org/2004/02/skos/core#",
      "dct": "http://purl.org/dc/terms/"
    },
    "@graph": graph
  }
);

  return {
    "@context": {
      "skos": "http://www.w3.org/2004/02/skos/core#",
      "dct": "http://purl.org/dc/terms/"
    },
    "@graph": graph
  };
}
