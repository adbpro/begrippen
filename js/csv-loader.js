document.getElementById("csvInput").addEventListener("change", evt => {
  const file = evt.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const csvText = reader.result;
    localStorage.setItem("savedCSV", csvText);

    jsonld = csvToJsonLD(csvText);
    concepts = jsonld["@graph"];
    loadConceptList();
  };
  reader.readAsText(file, "UTF-8");
});

const savedCSV = localStorage.getItem("savedCSV");
if (savedCSV) {
  jsonld = csvToJsonLD(savedCSV);
  concepts = jsonld["@graph"];
  loadConceptList();
}
