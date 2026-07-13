function loadConceptList() {
  const ul = document.getElementById("conceptList");
  ul.innerHTML = "";

  const sorted = concepts
    .slice()
    .sort((a,b) =>
      (a["skos:prefLabel"] || "").localeCompare(b["skos:prefLabel"] || "")
    );

  sorted.forEach(c => {
    const li = document.createElement("li");
    const uri = c["@id"];
    const label = c["skos:prefLabel"] || "(geen label)";
    li.innerHTML = `<a href="?uri_id=${encodeURIComponent(uri)}">${label}</a>`;
    ul.appendChild(li);
  });

  const activeUri = getQueryParam("uri_id");
  if (activeUri) showConcept(activeUri);

  loadABCNavigator();
}

/* -------- A–Z Navigator -------- */
function loadABCNavigator() {
  const container = document.getElementById("abcNavigator");
  container.innerHTML = "";

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Maak buttons voor A-Z
  letters.forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.classList.add("az-btn");  // voeg class toe voor styling

    btn.onclick = () => {
      const ul = document.getElementById("conceptList");
      ul.innerHTML = "";

      const filtered = concepts.filter(c =>
        (c["skos:prefLabel"] || "").toUpperCase().startsWith(letter)
      );

      filtered
        .sort((a,b) =>
          (a["skos:prefLabel"] || "").localeCompare(b["skos:prefLabel"] || "")
        )
        .forEach(c => {
          const li = document.createElement("li");
          li.innerHTML = `<a href="?uri_id=${encodeURIComponent(c["@id"])}">${c["skos:prefLabel"]}</a>`;
          ul.appendChild(li);
        });
    };

    container.appendChild(btn);
  });

  // Voeg een '*' button toe om alles weer te geven
  const allBtn = document.createElement("button");
  allBtn.textContent = "*";
  allBtn.classList.add("az-btn");

  allBtn.onclick = () => {
    const ul = document.getElementById("conceptList");
    ul.innerHTML = "";

    concepts
      .sort((a,b) =>
        (a["skos:prefLabel"] || "").localeCompare(b["skos:prefLabel"] || "")
      )
      .forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="?uri_id=${encodeURIComponent(c["@id"])}">${c["skos:prefLabel"]}</a>`;
        ul.appendChild(li);
      });
  };

  container.appendChild(allBtn);
}

/* -------- Zoeken met directe shortlist -------- */
document.getElementById("searchInput").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const results = document.getElementById("searchResults");

  if (!query) {
    results.innerHTML = "";
    return;
  }

  const matches = concepts
    .filter(c =>
      (c["skos:prefLabel"] || "").toLowerCase().includes(query)
    )
    .slice(0, 20); // max 20 resultaten

  results.innerHTML = matches
    .map(c => {
      const label = c["skos:prefLabel"];
      const uri = c["@id"];
      return `<li><a href="?uri_id=${encodeURIComponent(uri)}">${label}</a></li>`;
    })
    .join("");
});