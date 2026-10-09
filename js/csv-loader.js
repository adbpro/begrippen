// Herstel eerst de oorspronkelijke nette URL
const requestedPath = sessionStorage.getItem("requestedPath");

if (requestedPath) {
  sessionStorage.removeItem("requestedPath");
  history.replaceState(null, "", requestedPath);
}


// CSV laden in de viewer
function loadCSV(csvText, save = false) {

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

  const conceptList = document.getElementById("conceptList");
  const conceptContainer = document.getElementById("conceptContainer");
  const conceptJson = document.getElementById("conceptJson");
  const graph = document.getElementById("graph");
  const abcNavigator = document.getElementById("abcNavigator");

  if (conceptList) {
    conceptList.innerHTML = "";
  }

  if (conceptContainer) {
    conceptContainer.innerHTML = "";
  }

  if (conceptJson) {
    conceptJson.textContent = "";
  }

  if (graph) {
    graph.innerHTML = "";
  }

  if (abcNavigator) {
    abcNavigator.innerHTML = "";
  }
}


// Handmatig CSV-bestand laden
document.getElementById("csvInput").addEventListener("change", evt => {

  const file = evt.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    loadCSV(reader.result, true);
  };

  reader.readAsText(file, "UTF-8");
});


// Automatisch CSV laden op basis van URL
async function loadDirectoryCSV() {

  const basePath = "/begrippen/";
  const currentPath = window.location.pathname;

  const subPath = currentPath
    .replace(basePath, "")
    .replace(/\/$/, "");

  // Root
  if (!subPath || subPath === "index.html") {
    return false;
  }

  // Alleen één niveau toestaan
  if (subPath.includes("/")) {
    clearViewer();
    return false;
  }

  const csvUrl = `${basePath}${encodeURIComponent(subPath)}.csv`;

  try {

    const response = await fetch(csvUrl);

    if (!response.ok) {
      clearViewer();
      return false;
    }

    const csvText = await response.text();

    localStorage.removeItem("savedCSV");

    loadCSV(csvText, false);

    console.log(`CSV automatisch geladen: ${csvUrl}`);

    return true;

  } catch (error) {

    console.warn(`CSV kon niet worden geladen: ${csvUrl}`, error);

    localStorage.removeItem("savedCSV");
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

  // ROOT: /begrippen/
  if (!subPath || subPath === "index.html") {

    const savedCSV = localStorage.getItem("savedCSV");

    if (savedCSV) {
      loadCSV(savedCSV);
    }

    return;
  }

  // URI: /begrippen/<naam>/
  await loadDirectoryCSV();

})();