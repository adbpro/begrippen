function loadCSV(csvText) {
  localStorage.setItem("savedCSV", csvText);

  jsonld = csvToJsonLD(csvText);
  concepts = jsonld["@graph"];

  loadConceptList();

  // Schakel terug naar tab Navigeren
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.remove("active");
  });

  document.querySelector('[data-tab="navTab"]').classList.add("active");
  document.getElementById("navTab").classList.add("active");
}

// Handmatig CSV-bestand laden
document.getElementById("csvInput").addEventListener("change", evt => {
  const file = evt.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    loadCSV(reader.result);
  };

  reader.readAsText(file, "UTF-8");
});


// Automatisch begrippen.csv laden wanneer we in een subdirectory zitten
async function loadDirectoryCSV() {
  const basePath = "/begrippen/";
  const currentPath = window.location.pathname;

  // Verwijder /begrippen/ en eventuele afsluitende /
  const subPath = currentPath
    .replace(basePath, "")
    .replace(/\/$/, "");

  // Root van de viewer: niets automatisch laden
  if (!subPath || subPath === "index.html") {
    return false;
  }

  // Pak het laatste onderdeel van het pad
  const name = subPath.split("/").pop();

  // CSV staat in de root van /begrippen/
  const csvUrl = `${basePath}${name}.csv`;

  try {
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const csvText = await response.text();

    // Oude handmatig geladen CSV verwijderen
    localStorage.removeItem("savedCSV");

    loadCSV(csvText);

    console.log(`CSV automatisch geladen: ${csvUrl}`);

    return true;

  } catch (error) {
    console.warn(`CSV kon niet worden geladen: ${csvUrl}`, error);

    return false;
  }
}


// Initialisatie
(async () => {
  const loaded = await loadDirectoryCSV();

  // Alleen terugvallen op localStorage als er geen directory-CSV is geladen
  if (!loaded) {
    const savedCSV = localStorage.getItem("savedCSV");

    if (savedCSV) {
      loadCSV(savedCSV);
    }
  }
})();