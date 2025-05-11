import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

export default function NodeNetwork({ data }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  // Función para actualizar el tamaño del SVG
  const updateSvgSize = () => {
    if (containerRef.current && svgRef.current) {
      const width = containerRef.current.clientWidth;
      const height = Math.max(500, containerRef.current.clientHeight);
      d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);
    }
  };

  // Effect para manejar el resize de la ventana
  useEffect(() => {
    window.addEventListener("resize", updateSvgSize);
    return () => window.removeEventListener("resize", updateSvgSize);
  }, []);

  // Procesar datos cuando cambian
  useEffect(() => {
    if (!data) return;

    // Preparar los datos para la visualización
    const networkNodes = [
      // Nodo central (red eléctrica)
      {
        id: "grid",
        name: "Red Eléctrica",
        type: "grid",
        size: 30,
      },
      // Procesar hogares
      ...data.homes.map((home, i) => ({
        id: `home-${i}`,
        name: `Hogar ${i + 1}`,
        type: "home",
        consumption: home.consumption,
        size: 10 + home.consumption / 10, // Tamaño proporcional al consumo
      })),
      // Procesar comercios
      ...data.businesses.map((business, i) => ({
        id: `business-${i}`,
        name: `Comercio ${i + 1}`,
        type: "business",
        consumption: business.consumption,
        size: 12 + business.consumption / 15,
      })),
      // Procesar industrias
      ...data.industries.map((industry, i) => ({
        id: `industry-${i}`,
        name: `Industria ${i + 1}`,
        type: "industry",
        consumption: industry.consumption,
        size: 15 + industry.consumption / 20,
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

  // Renderizar la visualización cuando cambian nodos o enlaces
  useEffect(() => {
    if (!nodes.length || !links.length || !containerRef.current) return;

    // Limpiar cualquier SVG anterior
    d3.select(containerRef.current).select("svg").remove();

    // Obtener dimensiones del contenedor
    const width = containerRef.current.clientWidth;
    const height = 500; // Altura fija para simplicidad

    // Crear el SVG
    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("ref", svgRef);

    // Crear una simulación de fuerzas
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 100 + d.value * 2) // Distancia basada en consumo
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
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
          return d3
            .symbol()
            .type(d3.symbolStar)
            .size((d) => 600)();
        case "home":
          return d3
            .symbol()
            .type(d3.symbolCircle)
            .size((d) => 200)();
        case "business":
          return d3
            .symbol()
            .type(d3.symbolSquare)
            .size((d) => 200)();
        case "industry":
          return d3
            .symbol()
            .type(d3.symbolTriangle)
            .size((d) => 250)();
        default:
          return d3
            .symbol()
            .type(d3.symbolCircle)
            .size((d) => 200)();
      }
    };

    // Crear un elemento defs para gradientes
    const defs = svg.append("defs");

    // Crear gradientes para los enlaces según consumo
    links.forEach((link, i) => {
      const gradientId = `link-gradient-${i}`;
      const gradient = defs
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("gradientUnits", "userSpaceOnUse");

      // Color desde nodo central (azul) a color de tipo de nodo
      const targetNode = nodes.find((n) => n.id === link.target);
      const targetColor = getNodeColor(targetNode.type);

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", getNodeColor("grid"));

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", targetColor);

      // Añadir id de gradiente al enlace
      link.gradientId = gradientId;
    });

    // Crear enlaces
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => `url(#${d.gradientId})`)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Crear contenedor para nodos
    const nodeGroup = svg.append("g");

    // Crear nodos
    const node = nodeGroup
      .selectAll("path")
      .data(nodes)
      .enter()
      .append("path")
      .attr("d", (d) => getNodeSymbol(d.type))
      .attr("fill", (d) => getNodeColor(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("transform", (d) => `scale(${d.size / 15})`) // Escalar según tamaño
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Agregar etiquetas para el nodo central y otros nodos importantes
    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodes.filter((n) => n.id === "grid" || n.consumption > 15)) // Solo etiqueta nodos importantes
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", "12px")
      .attr("dx", 15)
      .attr("dy", 4)
      .style("pointer-events", "none"); // Evitar que interfiera con eventos de mouse

    // Crear tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "tooltip absolute hidden bg-white p-2 rounded shadow-lg text-sm z-10 pointer-events-none"
      )
      .style("pointer-events", "none")
      .attr("ref", tooltipRef);

    // Eventos de mouse para nodos
    node
      .on("mouseover", function (event, d) {
        // Mostrar tooltip
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

        // Resaltar nodo y enlaces relacionados
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);

        // Resaltar enlaces conectados
        link
          .filter((l) => l.source.id === d.id || l.target.id === d.id)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", (l) => Math.sqrt(l.value) * 1.5);
      })
      .on("mouseout", function () {
        // Ocultar tooltip
        tooltip.classed("hidden", true);

        // Restaurar estilo de nodo
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);

        // Restaurar enlaces
        link
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", (d) => Math.sqrt(d.value));
      });

    // Función de actualización
    simulation.on("tick", () => {
      // Actualizar posición de enlaces
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      // Actualizar posición de nodos
      node.attr("transform", (d) => {
        // Limitar posición al área visible
        d.x = Math.max(d.size, Math.min(width - d.size, d.x));
        d.y = Math.max(d.size, Math.min(height - d.size, d.y));

        // Escalar según tamaño y posicionar
        return `translate(${d.x}, ${d.y}) scale(${d.size / 15})`;
      });

      // Actualizar posición de etiquetas
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
        .attr("transform", `translate(0, ${i * 20}) scale(1.2)`);

      legend
        .append("text")
        .text(item.label)
        .attr("x", 15)
        .attr("y", i * 20 + 5)
        .attr("font-size", "12px");
    });

    // Actualizar dimensiones
    updateSvgSize();
  }, [nodes, links]);

  if (!data) return null;

  return (
    <div
      id="network-container"
      className="w-full h-full relative"
      ref={containerRef}
      style={{ minHeight: "500px" }}
    ></div>
  );
}
