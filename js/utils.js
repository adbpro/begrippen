function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function getPrefLabelByUri(uri, concepts) {
  const c = concepts.find(x => x["@id"] === uri);
  return c ? (c["skos:prefLabel"] || uri) : uri;
}

function formatSingleValue(val, concepts) {
  if (typeof val === "string" && val.startsWith("http")) {
    const label = getPrefLabelByUri(val, concepts);
    return `<a href="?uri_id=${encodeURIComponent(val)}">${label}</a>`;
  }
  return val;
}

function formatValue(value, concepts) {
  if (Array.isArray(value)) {
    return value
      .map(v => formatSingleValue(v, concepts))
      .map(v => linkifyText(v, concepts))   // hyperlinks in definities/toelichtingen
      .join("<br>");
  } else {
    const single = formatSingleValue(value, concepts);
    return linkifyText(single, concepts);
  }
}

function linkifyText(text, concepts) {
  if (!text || typeof text !== "string") return text;

  // Labels op lengte sorteren (langste eerst)
  const sortedLabels = concepts
    .map(c => c["skos:prefLabel"])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  // Escape regex-tekens
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Nieuwe regex zonder \b, want woordgrenzen werken slecht bij
  // meervoudige woorden, koppeltekens, hoofdletters etc.
  // In plaats daarvan gebruiken we negatieve lookarounds om HTML niet te breken.
  let linked = text;

  sortedLabels.forEach(label => {
    const concept = concepts.find(c => c["skos:prefLabel"] === label);
    if (!concept) return;
    const uri = concept["@id"];

    // We matchen label ALLEEN als het niet binnen een HTML-tag zit
    // dus tussen '>' en '<'
    const pattern = new RegExp(
      `(?<![\\w\\-])(${escapeRegex(label)})(?![\\w\\-])`,
      "gi"
    );

    linked = linked.replace(pattern, match => {
      return `<a href="?uri_id=${encodeURIComponent(uri)}">${match}</a>`;
    });
  });

  return linked;
}


