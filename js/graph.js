function renderConceptGraph(concept) {
  // Bewaar huidige concept om opnieuw te renderen bij filter toggle
  window.currentConcept = concept;

  // Huidig geselecteerde filters
  const activeFilters = Array.from(document.querySelectorAll(".graph-filter:checked"))
    .map(cb => cb.value);

  const graphDiv = d3.select("#graph");
  graphDiv.selectAll("*").remove();

  const width = graphDiv.node().clientWidth;
  const height = graphDiv.node().clientHeight;

  const nodes = new Map();
  const links = [];

  function addNode(id, label, main = false) {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label, main });
    }
  }

  function addLink(source, target, type) {
    links.push({ source, target, type });
  }

  const uri = concept["@id"];
  const prefLabel = concept["skos:prefLabel"];
  addNode(uri, prefLabel, true); // hoofdnode altijd zichtbaar

  // RELATIES EN ALT LABELS
  const relPriority = {
    "skos:altLabel": 0,
    "skos:broader": 1,
    "skos:narrower": 1,
    "skos:related": 2
  };
  const bestRelationForTarget = new Map();

  ["skos:altLabel", "skos:broader", "skos:narrower", "skos:related"].forEach(rel => {
    const values = concept[rel];
    if (!values) return;
    const arr = Array.isArray(values) ? values : [values];

    arr.forEach(targetURI => {
      const label = getPrefLabelByUri(targetURI, concepts) || targetURI;
      addNode(targetURI, label);

      if (!bestRelationForTarget.has(targetURI)) {
        bestRelationForTarget.set(targetURI, rel);
      } else if (relPriority[rel] < relPriority[bestRelationForTarget.get(targetURI)]) {
        bestRelationForTarget.set(targetURI, rel);
      }
    });
  });

  // Voeg alleen links toe die binnen de actieve filters vallen
  bestRelationForTarget.forEach((rel, targetURI) => {
    if (activeFilters.includes(rel)) {
      addLink(uri, targetURI, rel);
    }
  });

  // Filter nodes: alleen nodes die in links voorkomen of hoofdnode
  const visibleNodeIds = new Set([uri]);
  links.forEach(l => {
    visibleNodeIds.add(l.source);
    visibleNodeIds.add(l.target);
  });
  const nodeList = Array.from(nodes.values()).filter(n => visibleNodeIds.has(n.id));

  // D3 SVG
  const svg = graphDiv.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  // MARKERS
  svg.append("defs").selectAll("marker")
    .data([{ id: "arrow-broader", color: "#ffcc00" }, { id: "arrow-narrower", color: "#00ffaa" }])
    .enter()
    .append("marker")
      .attr("id", d => d.id)
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto-start-reverse")
      .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", d => d.color);

  const sim = d3.forceSimulation(nodeList)
    .force("link", d3.forceLink(links).id(d => d.id).distance(130))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // LINKS
  const link = svg.append("g").selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", d => {
      if (d.type === "skos:broader") return "#ffcc00";
      if (d.type === "skos:narrower") return "#00ffaa";
      if (d.type === "skos:altLabel") return "#ff66cc";
      return "#999";
    })
    .attr("stroke-width", 2)
    .attr("marker-end", d => d.type === "skos:broader" ? "url(#arrow-broader)" : null)
    .attr("marker-start", d => d.type === "skos:narrower" ? "url(#arrow-narrower)" : null);

  // NODES
  const node = svg.append("g").selectAll("circle")
    .data(nodeList)
    .join("circle")
    .attr("r", d => d.main ? 12 : 8)
    .attr("class", d => d.main ? "graph-node-main" : links.some(l => l.target === d.id && l.type === "skos:altLabel") ? "graph-node-alt" : "graph-node")
    .style("cursor", "pointer")
    .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
    .on("click", (e, d) => window.location = "?uri_id=" + encodeURIComponent(d.id));

  // NODE LABELS
  const nodeLabels = svg.append("g").selectAll("text")
    .data(nodeList)
    .join("text")
    .text(d => d.label)
    .attr("font-size", 12)
    .attr("dx", 10)
    .attr("dy", 4)
    .attr("class", "graph-label")
    .style("cursor", "pointer")
    .style("fill", document.body.classList.contains("light-mode") ? "#000" : "#fff")
    .on("click", (e, d) => window.location = "?uri_id=" + encodeURIComponent(d.id));

  // LINK LABELS
  const linkLabels = svg.append("g").selectAll("text")
    .data(links)
    .join("text")
    .text(d => d.type.replace("skos:", ""))
    .attr("font-size", 11)
    .attr("class", "graph-link-label");

  // SIMULATION TICK
  sim.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

    linkLabels.attr("x", d => (d.source.x + d.target.x)/2)
              .attr("y", d => (d.source.y + d.target.y)/2);

    node.attr("cx", d => d.x).attr("cy", d => d.y);
    nodeLabels.attr("x", d => d.x).attr("y", d => d.y);
  });

  // DRAG FUNCTIONS
  function dragstarted(event,d) { if(!event.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; }
  function dragged(event,d){ d.fx=event.x; d.fy=event.y; }
  function dragended(event,d){ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }
}
