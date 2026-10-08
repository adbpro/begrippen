function loadCSV(csvText) {
  localStorage.setItem("savedCSV", csvText);

  jsonld = csvToJsonLD(csvText);
  concepts = jsonld["@graph"];

  loadConceptList();
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

  // Root van de viewer: geen automatische CSV laden
  if (
    currentPath === basePath ||
    currentPath === `${basePath}index.html`
  ) {
    return false;
  }

  // Bepaal directory van de huidige URL
  const directory = currentPath.endsWith("/")
    ? currentPath
    : currentPath.substring(0, currentPath.lastIndexOf("/") + 1);

  const csvUrl = `${directory}begrippen.csv`;

  try {
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const csvText = await response.text();

    loadCSV(csvText);

    console.log(`CSV automatisch geladen: ${csvUrl}`);

    return true;
  } catch (error) {
    console.warn(
      `Geen begrippen.csv gevonden in ${directory}`,
      error
    );

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