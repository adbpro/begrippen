document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  
  // Stel initiële toestand in
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    toggleBtn.textContent = "Dark mode";
  } else {
    toggleBtn.textContent = "Light mode";
  }

  // render de huidige concept graph (initieel)
if(window.currentConcept) {
  renderConceptGraph(window.currentConcept);
}

  // Toggle theme en knoptekst
  toggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    toggleBtn.textContent = isLight ? "Dark mode" : "Light mode";

      // Update D3 labels
  d3.selectAll(".graph-label")
    .transition()
    .duration(300)
    .style("fill", isLight ? "#000" : "#fff");
  });

  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(
        document.getElementById("conceptJson").textContent
      );
      alert("JSON gekopieerd");
    };
  }
});


// ----------------------------
  // Tab functionaliteit
  // ----------------------------
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // active class op buttons
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // active class op tab content
      tabContents.forEach(tc => tc.classList.remove("active"));
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });



  document.querySelectorAll(".graph-filter").forEach(cb => {
  cb.addEventListener("change", () => {
    if(window.currentConcept) {
      renderConceptGraph(window.currentConcept);
    }
  });
});
