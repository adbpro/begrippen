function showConcept(uri) {
  const concept = concepts.find(c => c["@id"] === uri);
  const container = document.getElementById("conceptContainer");

  if (!concept) {
    container.innerHTML = "Geen concept gevonden.";
    return;
  }

  // Helper: formatValue met spatie voor relaties
  function formatValue(value, concepts, key) {
    if (Array.isArray(value)) {
      // Voor relaties naast elkaar met spatie
      if (["skos:broader", "skos:narrower", "skos:related"].includes(key)) {
        return value
          .map(v => formatSingleValue(v, concepts))
          .map(v => linkifyText(v, concepts))
          .join(" "); // <--- spatie
      } else {
        return value
          .map(v => formatSingleValue(v, concepts))
          .map(v => linkifyText(v, concepts))
          .join("<br>");
      }
    } else {
      const single = formatSingleValue(value, concepts);
      return linkifyText(single, concepts);
    }
  }

  // Tabelrijen genereren
  const rows = Object.entries(concept)
    .filter(([k]) => !k.startsWith("@"))
    .map(([k, v]) => {
      const human = labelMap[k] || k; // mensnaam
      const tech = k;                  // technische naam
      return `
        <tr>
          <th>
            ${human}<br>
            <small style="color:#999; font-size:0.8em;">(${tech})</small>
          </th>
          <td>${formatValue(v, concepts, k)}</td>
        </tr>
      `;
    })
    .join("");

  // Tabel in container
  container.innerHTML = `<table>
    <tr><th>URI</th><td>${uri}</td></tr>
    ${rows}
  </table>`;

  // JSON onder de tabel
  document.getElementById("conceptJson").textContent =
    JSON.stringify(concept, null, 2);

  // Graph renderen (optioneel, kan afhankelijk van tab)
  renderConceptGraph(concept);

  // Bewaar current concept voor tab-switching of andere functies
  window.currentConcept = concept;
}
