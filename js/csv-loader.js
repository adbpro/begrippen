// Herstel eerst de oorspronkelijke nette URL
const requestedPath = sessionStorage.getItem("requestedPath");

if (requestedPath) {
  sessionStorage.removeItem("requestedPath");
  history.replaceState(null, "", requestedPath);
}


function loadCSV(csvText, save = false) {
  // Alleen handmatig geladen CSV bewaren
  if (save) {
    localStorage.setItem("savedCSV", csvText);
  }

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


// Viewer leegmaken
function clearViewer() {
  jsonld = null;
  concepts = [];

  document.getElementById("conceptList").innerHTML = "";
  document.getElementById("conceptContainer").innerHTML = "";
  document.getElementById("conceptJson").textContent = "";
  document.getElementById("graph").innerHTML = "";
  document.getElementById("abcNavigator").innerHTML = "";
}


// Handmatig CSV-bestand laden
document.getElementById("csvInput").addEventListener("change", evt => {
  const file = evt.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    // Handmatig geladen CSV bewaren
    loadCSV(reader.result, true);
  };

  reader.readAsText(file, "UTF-8");
});


// Automatisch CSV laden op basis van de URI
async function loadDirectoryCSV() {
  const basePath = "/begrippen/";
  const currentPath = window.location.pathname;

  // Verwijder /begrippen/ en eventuele afsluitende /
  const subPath = currentPath
    .replace(basePath, "")
    .replace(/\/$/, "");

  // Root van de viewer
  if (!subPath || subPath === "index.html") {
    return false;
  }

  // Alleen één niveau toestaan:
  // /begrippen/spoorsebegrippen/ is geldig
  // /begrippen/iets/anders/ niet
  if (subPath.includes("/")) {
    clearViewer();
    return false;
  }

  const csvUrl = `${basePath}${encodeURIComponent(subPath)}.csv`;

  try {
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const csvText = await response.text();

    // Oude handmatig geladen CSV verwijderen
    localStorage.removeItem("savedCSV");

    // Automatisch geladen CSV NIET in localStorage bewaren
    loadCSV(csvText);

    console.log(`CSV automatisch geladen: ${csvUrl}`);

    return true;

  } catch (error) {
    console.warn(`CSV kon niet worden geladen: ${csvUrl}`, error);

    // Belangrijk: eventueel oude data verwijderen
    localStorage.removeItem("savedCSV");

    // Viewer blijft leeg
    clearViewer();

    return false;
  }
}


// Initialisatie
(async () => {
  const basePath = "/begrippen/";
  const currentPath = window.location.pathname;

  const subPath = currentPath
    .replace(basePath, "")
    .replace(/\/$/, "");

  // -----------------------------------------
  // ROOT: /begrippen/
  // -----------------------------------------
  if (!subPath || subPath === "index.html") {

    // Op de root mag de laatst handmatig
    // geladen CSV worden hersteld
    const savedCSV = localStorage.getItem("savedCSV");

    if (savedCSV) {
      loadCSV(savedCSV);
    }

    return;
  }

  // -----------------------------------------
  // URI: /begrippen/<naam>/
  // -----------------------------------------

  // Als er een naam in de URI staat,
  // is uitsluitend die CSV 