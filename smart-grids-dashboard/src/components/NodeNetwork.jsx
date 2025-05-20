import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

export default function NodeNetwork({ data }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  // Colores para los diferentes tipos de nodos con mejor paleta
  const colorScheme = {
    grid: "#1d4ed8", // Azul más saturado
    home: "#16a34a", // Verde más vivo
    business: "#ea580c", // Naranja más cálido
    industry: "#dc2626", // Rojo más vibrante
    selected: "#8b5cf6", // Púrpura para nodos seleccionados
  };

  // Configuraciones para la simulación y visualización
  const config = {
    nodePadding: 15,
    baseNodeSize: 8,
    linkStrength: 0.7,
    chargeStrength: -400,
    centerForce: 1,
    collisionRadius: 1.8,
    animationDuration: 300,
  };

  // Actualizar el tamaño del SVG cuando cambie el contenedor
  const updateSvgSize = () => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = Math.max(600, containerRef.current.clientHeight);

    d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // También actualizar la simulación si existe
    if (window.networkSimulation) {
      window.networkSimulation
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alpha(0.3)
        .restart();
    }
  };

  // Efecto para manejar el resize de la ventana
  useEffect(() => {
    updateSvgSize();
    window.addEventListener("resize", updateSvgSize);
    return () => window.removeEventListener("resize", updateSvgSize);
  }, []);

  // Procesar datos cuando cambian
  useEffect(() => {
    if (!data) return;

    // Preparar los datos para la visualización con categorías más claras
    const networkNodes = [
      // Nodo central (red eléctrica)
      {
        id: "grid",
        name: "Red Eléctrica",
        type: "grid",
        size: config.baseNodeSize * 4,
        description: "Centro de distribución de energía",
      },
      // Procesar hogares
      ...data.homes.map((home, i) => ({
        id: `home-${i}`,
        name: `Hogar ${i + 1}`,
        type: "home",
        consumption: home.consumption,
        size: config.baseNodeSize + Math.sqrt(home.consumption) * 0.8,
        description: `Vivienda residencial con consumo de ${home.consumption.toFixed(
          1
        )} kW`,
      })),
      // Procesar comercios
      ...data.businesses.map((business, i) => ({
        id: `business-${i}`,
        name: `Comercio ${i + 1}`,
        type: "business",
        consumption: business.consumption,
        size: config.baseNodeSize + Math.sqrt(business.consumption) * 0.7,
        description: `Establecimiento comercial con consumo de ${business.consumption.toFixed(
          1
        )} kW`,
      })),
      // Procesar industrias
      ...data.industries.map((industry, i) => ({
        id: `industry-${i}`,
        name: `Industria ${i + 1}`,
        type: "industry",
        consumption: industry.consumption,
        size: config.baseNodeSize + Math.sqrt(industry.consumption) * 0.6,
        description: `Planta industrial con consumo de ${industry.consumption.toFixed(
          1
        )} kW`,
      })),
    ];

    // Crear enlaces con grosor proporcionado al consumo de manera más equilibrada
    const networkLinks = networkNodes
      .filter((node) => node.id !== "grid")
      .map((node) => ({
        source: "grid",
        target: node.id,
        value: node.consumption || 1,
        width: Math.max(1, Math.sqrt(node.consumption || 1) / 2),
      }));

    setNodes(networkNodes);
    setLinks(networkLinks);
  }, [data]);

  // Función para determinar la forma según el tipo de nodo
  const getNodeSymbol = (d) => {
    const base = d3.symbol().size(d.size * 25);

    switch (d.type) {
      case "grid":
        return d3
          .symbol()
          .type(d3.symbolStar)
          .size(d.size * 40)();
      case "home":
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(d.size * 25)();
      case "business":
        return d3
          .symbol()
          .type(d3.symbolSquare)
          .size(d.size * 30)();
      case "industry":
        return d3
          .symbol()
          .type(d3.symbolTriangle)
          .size(d.size * 35)();
      default:
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(d.size * 25)();
    }
  };

  // Renderizar la visualización cuando cambian nodos o enlaces
  useEffect(() => {
    if (!nodes.length || !links.length || !containerRef.current) return;

    // Limpiar cualquier SVG anterior
    d3.select(containerRef.current).select("svg").remove();

    // Obtener dimensiones del contenedor
    const width = containerRef.current.clientWidth;
    const height = 600; // Altura mayor para mejor visualización

    // Crear el SVG con mejor definición
    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "bg-gray-50 rounded-lg shadow-inner")
      .attr("ref", svgRef);

    // Agregar un fondo de cuadrícula sutil para mejor orientación
    const gridSize = 20;
    svg
      .append("defs")
      .append("pattern")
      .attr("id", "grid")
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", `M ${gridSize} 0 L 0 0 0 ${gridSize}`)
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 0.5);

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid)");

    // Crear una simulación de fuerzas más equilibrada
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 100 + Math.sqrt(d.value) * 10)
          .strength(config.linkStrength)
      )
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength((d) =>
            d.type === "grid"
              ? config.chargeStrength * 2
              : config.chargeStrength
          )
      )
      .force(
        "center",
        d3.forceCenter(width / 2, height / 2).strength(config.centerForce)
      )
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size * config.collisionRadius)
      )
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    // Guardar la simulación para poder acceder a ella después
    window.networkSimulation = simulation;

    // Crear definiciones para efectos visuales
    const defs = svg.append("defs");

    // Añadir sombras para mejor profundidad
    defs
      .append("filter")
      .attr("id", "shadow")
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 1)
      .attr("stdDeviation", 2)
      .attr("flood-opacity", 0.3);

    // Añadir gradiente para enlaces
    const linkGradient = defs
      .append("linearGradient")
      .attr("id", "linkGradient")
      .attr("gradientUnits", "userSpaceOnUse");

    linkGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorScheme.grid);

    linkGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#94a3b8");

    // Añadir glow para nodos seleccionados
    defs
      .append("filter")
      .attr("id", "glow")
      .append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");

    // Crear grupo para enlaces
    const linkGroup = svg.append("g").attr("class", "links");

    // Crear enlaces con mayor calidad visual
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "url(#linkGradient)")
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", (d) => d.width)
      .attr("stroke-linecap", "round");

    // Crear contenedor para nodos
    const nodeGroup = svg.append("g").attr("class", "nodes");

    // Crear nodos con mejor visualización
    const node = nodeGroup
      .selectAll("path")
      .data(nodes)
      .enter()
      .append("path")
      .attr("d", (d) => getNodeSymbol(d))
      .attr("fill", (d) => colorScheme[d.type])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("filter", "url(#shadow)")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Etiquetas mejoradas
    const labelGroup = svg.append("g").attr("class", "labels");

    const labels = labelGroup
      .selectAll("text")
      .data(nodes.filter((n) => n.id === "grid" || n.consumption > 15))
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", "11px")
      .attr("font-weight", (d) => (d.type === "grid" ? "bold" : "normal"))
      .attr("fill", "#374151")
      .attr("dx", 15)
      .attr("dy", 4)
      .attr("pointer-events", "none")
      .attr(
        "text-shadow",
        "0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff"
      );

    // Crear tooltip mejorado
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-white p-3 rounded-lg shadow-lg text-sm z-10"
      )
      .style("pointer-events", "none")
      .style("max-width", "200px")
      .attr("ref", tooltipRef);

    // Mejorar eventos de interacción para nodos
    node
      .on("mouseover", function (event, d) {
        // Mostrar tooltip con diseño mejorado
        tooltip
          .html(
            `
            <div class="font-bold text-base mb-1 text-gray-900">${d.name}</div>
            <div class="text-gray-600 mb-2">${d.description || ""}</div>
            ${
              d.type !== "grid"
                ? `<div class="flex justify-between">
                <span class="text-gray-500">Consumo:</span>
                <span class="font-medium">${
                  d.consumption?.toFixed(1) || 0
                } kW</span>
              </div>`
                : `<div class="text-gray-500 italic">Centro de distribución</div>`
            }
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px")
          .classed("hidden", false);

        // Resaltar nodo activo
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#000")
          .attr("stroke-width", 2.5);

        // Resaltar enlaces conectados
        link
          .filter((l) => l.source.id === d.id || l.target.id === d.id)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", (l) => l.width * 2)
          .attr("stroke", colorScheme[d.type]);
      })
      .on("mouseout", function (event, d) {
        // Ocultar tooltip
        tooltip.classed("hidden", true);

        // Restaurar nodo (si no está seleccionado)
        if (!selectedNode || selectedNode.id !== d.id) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("filter", "url(#shadow)");
        }

        // Restaurar enlaces
        link
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.7)
          .attr("stroke-width", (d) => d.width)
          .attr("stroke", "url(#linkGradient)");
      })
      .on("click", function (event, d) {
        event.stopPropagation();

        // Si ya estaba seleccionado, deseleccionar
        if (selectedNode && selectedNode.id === d.id) {
          setSelectedNode(null);
          d3.select(this)
            .transition()
            .duration(config.animationDuration)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("filter", "url(#shadow)");
        }
        // Si no, seleccionar este nuevo nodo
        else {
          // Deseleccionar el anterior si existe
          if (selectedNode) {
            node
              .filter((n) => n.id === selectedNode.id)
              .transition()
              .duration(config.animationDuration)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5)
              .attr("filter", "url(#shadow)");
          }

          // Seleccionar el nuevo
          setSelectedNode(d);
          d3.select(this)
            .transition()
            .duration(config.animationDuration)
            .attr("stroke", colorScheme.selected)
            .attr("stroke-width", 3)
            .attr("filter", "url(#glow)");

          // Mostrar enlaces relacionados
          link
            .filter((l) => l.source.id === d.id || l.target.id === d.id)
            .transition()
            .duration(config.animationDuration)
            .attr("stroke", colorScheme[d.type])
            .attr("stroke-opacity", 1)
            .attr("stroke-width", (l) => l.width * 1.5);
        }
      });

    // Permitir deseleccionar haciendo clic en el fondo
    svg.on("click", () => {
      if (selectedNode) {
        node
          .filter((n) => n.id === selectedNode.id)
          .transition()
          .duration(config.animationDuration)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("filter", "url(#shadow)");

        link
          .transition()
          .duration(config.animationDuration)
          .attr("stroke", "url(#linkGradient)")
          .attr("stroke-opacity", 0.7)
          .attr("stroke-width", (d) => d.width);

        setSelectedNode(null);
      }
    });

    // Función de actualización más suave
    simulation.on("tick", () => {
      // Actualizar posición de enlaces con curvas suaves
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      // Actualizar posición de nodos con límites
      node.attr("transform", (d) => {
        // Limitar posición al área visible con margen
        d.x = Math.max(d.size, Math.min(width - d.size, d.x));
        d.y = Math.max(d.size, Math.min(height - d.size, d.y));

        return `translate(${d.x}, ${d.y})`;
      });

      // Actualizar posición de etiquetas con ajuste para evitar solapamiento
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Funciones para el arrastre de nodos mejoradas
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;

      // Aumentar tamaño durante arrastre
      d3.select(event.sourceEvent.target)
        .transition()
        .duration(200)
        .attr("stroke", "#000")
        .attr("stroke-width", 3);
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);

      // Restaurar apariencia normal si no está seleccionado
      if (!selectedNode || selectedNode.id !== d.id) {
        d3.select(event.sourceEvent.target)
          .transition()
          .duration(200)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5);
      }

      // Mantener fijo o liberar dependiendo de configuración
      if (event.sourceEvent.shiftKey) {
        // Mantener fijo si se presiona shift
        d.fx = d.x;
        d.fy = d.y;
      } else {
        // Liberar si no se presiona shift
        d.fx = null;
        d.fy = null;
      }
    }

    // Leyenda mejorada
    const legendData = [
      {
        type: "grid",
        label: "Red Eléctrica",
        description: "Fuente de distribución",
      },
      { type: "home", label: "Hogares", description: "Consumo residencial" },
      {
        type: "business",
        label: "Comercios",
        description: "Establecimientos comerciales",
      },
      {
        type: "industry",
        label: "Industrias",
        description: "Plantas industriales",
      },
    ];

    const legend = svg
      .append("g")
      .attr("transform", "translate(20, 20)")
      .attr("class", "bg-white bg-opacity-80 p-2 rounded")
      .attr("filter", "url(#shadow)");

    legend
      .append("rect")
      .attr("width", 150)
      .attr("height", legendData.length * 25 + 10)
      .attr("fill", "white")
      .attr("fill-opacity", 0.9)
      .attr("rx", 5)
      .attr("ry", 5);

    legendData.forEach((item, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(5, ${i * 25 + 15})`)
        .attr("cursor", "pointer");

      // Icono
      legendItem
        .append("path")
        .attr("d", getNodeSymbol({ ...item, size: 8 }))
        .attr("fill", colorScheme[item.type])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("transform", "scale(0.6)");

      // Texto
      legendItem
        .append("text")
        .text(item.label)
        .attr("x", 15)
        .attr("y", 4)
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("fill", "#374151");

      // Interactividad de la leyenda
      legendItem
        .on("mouseover", function () {
          // Resaltar nodos de este tipo
          node
            .filter((d) => d.type === item.type)
            .transition()
            .duration(200)
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

          // Atenuar otros tipos
          node
            .filter((d) => d.type !== item.type)
            .transition()
            .duration(200)
            .attr("opacity", 0.3);

          // Resaltar enlaces relacionados
          link
            .transition()
            .duration(200)
            .attr("opacity", (l) => {
              const sourceType = nodes.find(
                (n) =>
                  n.id ===
                  (typeof l.source === "object" ? l.source.id : l.source)
              )?.type;
              const targetType = nodes.find(
                (n) =>
                  n.id ===
                  (typeof l.target === "object" ? l.target.id : l.target)
              )?.type;
              return sourceType === item.type || targetType === item.type
                ? 1
                : 0.1;
            });

          // Resaltar texto de leyenda
          d3.select(this)
            .select("text")
            .transition()
            .duration(200)
            .attr("font-weight", "bold");
        })
        .on("mouseout", function () {
          // Restaurar todos los nodos y enlaces
          node
            .transition()
            .duration(200)
            .attr("opacity", 1)
            .attr("stroke", (d) =>
              selectedNode && selectedNode.id === d.id
                ? colorScheme.selected
                : "#fff"
            )
            .attr("stroke-width", (d) =>
              selectedNode && selectedNode.id === d.id ? 3 : 1.5
            );

          link.transition().duration(200).attr("opacity", 1);

          // Restaurar texto de leyenda
          d3.select(this)
            .select("text")
            .transition()
            .duration(200)
            .attr("font-weight", "500");
        })
        .on("click", function () {
          // Centrar la visualización en los nodos de este tipo
          const typeNodes = nodes.filter((n) => n.type === item.type);
          if (typeNodes.length === 0) return;

          // Calcular el centroide y escala
          let sumX = 0,
            sumY = 0;
          typeNodes.forEach((n) => {
            sumX += n.x;
            sumY += n.y;
          });

          const centerX = sumX / typeNodes.length;
          const centerY = sumY / typeNodes.length;

          // Actualizar la simulación para centrar estos nodos
          simulation
            .force(
              "x",
              d3
                .forceX((d) => (d.type === item.type ? width / 2 : width / 2))
                .strength((d) => (d.type === item.type ? 0.5 : 0.1))
            )
            .force(
              "y",
              d3
                .forceY((d) => (d.type === item.type ? height / 2 : height / 2))
                .strength((d) => (d.type === item.type ? 0.5 : 0.1))
            )
            .alpha(0.5)
            .restart();
        });
    });

    // Controles de zoom
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        nodeGroup.attr("transform", event.transform);
        linkGroup.attr("transform", event.transform);
        labelGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Botones de control para zoom
    const controls = svg
      .append("g")
      .attr("transform", `translate(${width - 100}, 20)`)
      .attr("class", "bg-white bg-opacity-80 rounded")
      .attr("filter", "url(#shadow)");

    controls
      .append("rect")
      .attr("width", 80)
      .attr("height", 35)
      .attr("fill", "white")
      .attr("fill-opacity", 0.9)
      .attr("rx", 5)
      .attr("ry", 5);

    // Botón de zoom in
    const zoomIn = controls
      .append("g")
      .attr("transform", "translate(15, 17.5)")
      .attr("cursor", "pointer");

    zoomIn
      .append("circle")
      .attr("r", 12)
      .attr("fill", "#f3f4f6")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1);

    zoomIn
      .append("line")
      .attr("x1", -6)
      .attr("y1", 0)
      .attr("x2", 6)
      .attr("y2", 0)
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 2);

    zoomIn
      .append("line")
      .attr("x1", 0)
      .attr("y1", -6)
      .attr("x2", 0)
      .attr("y2", 6)
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 2);

    zoomIn.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    // Botón de zoom out
    const zoomOut = controls
      .append("g")
      .attr("transform", "translate(65, 17.5)")
      .attr("cursor", "pointer");

    zoomOut
      .append("circle")
      .attr("r", 12)
      .attr("fill", "#f3f4f6")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1);

    zoomOut
      .append("line")
      .attr("x1", -6)
      .attr("y1", 0)
      .attr("x2", 6)
      .attr("y2", 0)
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 2);

    zoomOut.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    // Información adicional sobre interacción
    const helpText = svg
      .append("text")
      .attr("x", width - 20)
      .attr("y", height - 20)
      .attr("text-anchor", "end")
      .attr("font-size", "11px")
      .attr("fill", "#6b7280")
      .text("Shift+Arrastrar: Fija nodos | Doble-click: Reinicia posición");

    // Atajos de teclado
    d3.select("body").on("keydown", (event) => {
      // Escape deselecciona nodo
      if (event.key === "Escape" && selectedNode) {
        node
          .filter((n) => n.id === selectedNode.id)
          .transition()
          .duration(config.animationDuration)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("filter", "url(#shadow)");

        setSelectedNode(null);
      }

      // R reinicia la simulación
      if (event.key === "r") {
        nodes.forEach((d) => {
          d.fx = null;
          d.fy = null;
        });

        simulation.alpha(1).restart();
      }
    });

    // Actualizar dimensiones
    updateSvgSize();
  }, [nodes, links, selectedNode]);

  if (!data) return null;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center px-4 py-2 bg-white border-b">
        <h3 className="text-lg font-medium text-gray-900">
          Red de Distribución Eléctrica
        </h3>
        {selectedNode && (
          <div className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-800 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
            Nodo seleccionado: {selectedNode.name}
          </div>
        )}
      </div>
      <div
        id="network-container"
        className="w-full flex-grow relative"
        ref={containerRef}
        style={{ minHeight: "600px" }}
      ></div>
      <div className="text-xs text-gray-500 px-4 py-2 bg-gray-50 border-t">
        <span className="font-medium">Interacción:</span> Haz clic en un nodo
        para seleccionarlo. Arrástralo para moverlo. Mantén Shift al soltar para
        fijarlo.
      </div>
    </div>
  );
}
