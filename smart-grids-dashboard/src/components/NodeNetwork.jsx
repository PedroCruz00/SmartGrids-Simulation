import { useState, useEffect } from "react";
import * as d3 from "d3";

export default function NodeNetwork({ data }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (!data) return;

    // Preparar los datos para la visualización
    const networkNodes = [
      // Nodo central (red eléctrica)
      {
        id: "grid",
        name: "Red Eléctrica",
        type: "grid",
        x: 400,
        y: 250,
        size: 30,
      },
      // Procesar hogares
      ...data.homes.map((home, i) => ({
        id: `home-${i}`,
        name: `Hogar ${i + 1}`,
        type: "home",
        consumption: home.consumption,
        x: 200 + Math.random() * 400,
        y: 100 + Math.random() * 300,
        size: 10,
      })),
      // Procesar comercios
      ...data.businesses.map((business, i) => ({
        id: `business-${i}`,
        name: `Comercio ${i + 1}`,
        type: "business",
        consumption: business.consumption,
        x: 200 + Math.random() * 400,
        y: 100 + Math.random() * 300,
        size: 15,
      })),
      // Procesar industrias
      ...data.industries.map((industry, i) => ({
        id: `industry-${i}`,
        name: `Industria ${i + 1}`,
        type: "industry",
        consumption: industry.consumption,
        x: 200 + Math.random() * 400,
        y: 100 + Math.random() * 300,
        size: 20,
      })),
    ];

    // Crear enlaces desde el nodo central a cada consumidor
    const networkLinks = networkNodes
      .filter((node) => node.id !== "grid")
      .map((node) => ({
        source: "grid",
        target: node.id,
        value: node.consumption || 1,
      }));

    setNodes(networkNodes);
    setLinks(networkLinks);
  }, [data]);

  useEffect(() => {
    if (!nodes.length || !links.length) return;

    // Limpiar cualquier SVG anterior
    d3.select("#network-container").selectAll("*").remove();

    // Crear el SVG
    const svg = d3
      .select("#network-container")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 800 500");

    // Crear una simulación de fuerzas
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(400, 250))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size * 1.5)
      );

    // Función para determinar el color según el tipo de nodo
    const getNodeColor = (type) => {
      switch (type) {
        case "grid":
          return "#1e40af"; // Azul oscuro
        case "home":
          return "#22c55e"; // Verde
        case "business":
          return "#f59e0b"; // Naranja
        case "industry":
          return "#ef4444"; // Rojo
        default:
          return "#6b7280"; // Gris
      }
    };

    // Función para determinar la forma según el tipo de nodo
    const getNodeSymbol = (type) => {
      switch (type) {
        case "grid":
          return d3.symbol().type(d3.symbolStar).size(400)();
        case "home":
          return d3.symbol().type(d3.symbolCircle).size(200)();
        case "business":
          return d3.symbol().type(d3.symbolSquare).size(200)();
        case "industry":
          return d3.symbol().type(d3.symbolTriangle).size(250)();
        default:
          return d3.symbol().type(d3.symbolCircle).size(200)();
      }
    };

    // Crear enlaces
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Crear nodos
    const node = svg
      .append("g")
      .selectAll("path")
      .data(nodes)
      .enter()
      .append("path")
      .attr("d", (d) => getNodeSymbol(d.type))
      .attr("fill", (d) => getNodeColor(d.type))
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Agregar etiquetas para el nodo central
    const labels = svg
      .append("g")
      .selectAll("text")
      .data([nodes.find((n) => n.id === "grid")])
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", "12px")
      .attr("dx", 15)
      .attr("dy", 4);

    // Agregar tooltips
    const tooltip = d3
      .select("#network-container")
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-white p-2 rounded shadow-lg text-sm z-10"
      )
      .style("pointer-events", "none");

    node
      .on("mouseover", function (event, d) {
        tooltip
          .html(
            `
          <strong>${d.name}</strong><br/>
          ${
            d.type !== "grid"
              ? `Consumo: ${d.consumption?.toFixed(2) || 0} kW`
              : "Central de distribución"
          }
        `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px")
          .classed("hidden", false);
      })
      .on("mouseout", () => tooltip.classed("hidden", true));

    // Función de actualización
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Funciones para el arrastre de nodos
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Leyenda
    const legend = svg.append("g").attr("transform", "translate(20, 20)");

    const legendData = [
      { type: "grid", label: "Red Eléctrica" },
      { type: "home", label: "Hogares" },
      { type: "business", label: "Comercios" },
      { type: "industry", label: "Industrias" },
    ];

    legendData.forEach((item, i) => {
      legend
        .append("path")
        .attr("d", getNodeSymbol(item.type))
        .attr("fill", getNodeColor(item.type))
        .attr("transform", `translate(0, ${i * 20})`);

      legend
        .append("text")
        .text(item.label)
        .attr("x", 15)
        .attr("y", i * 20 + 5)
        .attr("font-size", "12px");
    });
  }, [nodes, links]);

  if (!data) return null;

  return <div id="network-container" className="w-full h-full relative"></div>;
}
