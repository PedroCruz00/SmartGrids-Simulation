import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

export default function NodeNetwork({ data }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [energyStats, setEnergyStats] = useState(null);
  const [layoutMode, setLayoutMode] = useState("radial"); // 'radial', 'sector', o 'force'
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  // Paleta de colores mejorada con mayor accesibilidad
  const colorScheme = {
    grid: "#1a56db", // Azul más vibrante
    home: "#047857", // Verde más rico pero accesible
    business: "#d97706", // Naranja con mejor contraste
    industry: "#b91c1c", // Rojo más saturado
    selected: "#7c3aed", // Púrpura para selección
    background: "#f9fafb", // Fondo claro
    gridLines: "#e5e7eb", // Líneas de cuadrícula
    text: "#111827", // Texto principal
    textLight: "#6b7280", // Texto secundario
  };

  // Configuraciones para la simulación y visualización
  const config = {
    nodePadding: 15,
    baseNodeSize: 8,
    linkStrength: 0.3, // Fuerza reducida para mejor distribución
    chargeStrength: -300,
    centerForce: 0.1, // Fuerza central reducida
    collisionRadius: 2,
    animationDuration: 300,
    sectorAngle: Math.PI / 8, // Para layout sectorial
    sectorSpread: 0.8, // Extensión del sector
    minLinkWidth: 1, // Grosor mínimo para enlaces
    maxLinkWidth: 5, // Grosor máximo para enlaces
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

  // Calcular estadísticas de energía
  const calculateEnergyStats = (nodeData) => {
    if (!nodeData || !nodeData.length) return null;

    const stats = {
      homes: {
        count: 0,
        totalConsumption: 0,
        avgConsumption: 0,
        maxConsumption: 0,
      },
      businesses: {
        count: 0,
        totalConsumption: 0,
        avgConsumption: 0,
        maxConsumption: 0,
      },
      industries: {
        count: 0,
        totalConsumption: 0,
        avgConsumption: 0,
        maxConsumption: 0,
      },
      total: {
        count: 0,
        totalConsumption: 0,
        avgConsumption: 0,
      },
    };

    // Mapeo de tipos a categorías
    const typeToCategory = {
      home: "homes",
      business: "businesses",
      industry: "industries",
    };

    // Agrupar por tipo y calcular estadísticas
    nodeData.forEach((node) => {
      if (node.type === "grid") return;

      // Verificar que el tipo es válido y tiene una categoría correspondiente
      const category = typeToCategory[node.type];
      if (!category || !stats[category]) return;

      stats[category].count++;
      stats[category].totalConsumption += node.consumption || 0;
      stats[category].maxConsumption = Math.max(
        stats[category].maxConsumption,
        node.consumption || 0
      );
      stats.total.count++;
      stats.total.totalConsumption += node.consumption || 0;
    });

    // Calcular promedios (con protección contra división por cero)
    stats.homes.avgConsumption = stats.homes.count
      ? stats.homes.totalConsumption / stats.homes.count
      : 0;

    stats.businesses.avgConsumption = stats.businesses.count
      ? stats.businesses.totalConsumption / stats.businesses.count
      : 0;

    stats.industries.avgConsumption = stats.industries.count
      ? stats.industries.totalConsumption / stats.industries.count
      : 0;

    stats.total.avgConsumption = stats.total.count
      ? stats.total.totalConsumption / stats.total.count
      : 0;

    return stats;
  };

  // Procesar datos cuando cambian
  useEffect(() => {
    if (!data) return;

    // Verificar que los datos tienen la estructura esperada
    const validData = {
      homes: Array.isArray(data.homes) ? data.homes : [],
      businesses: Array.isArray(data.businesses) ? data.businesses : [],
      industries: Array.isArray(data.industries) ? data.industries : [],
    };

    console.log("Datos de red procesados:", validData);

    // Preparar los datos para la visualización con categorías más claras
    const networkNodes = [
      // Nodo central (red eléctrica)
      {
        id: "grid",
        name: "Red Eléctrica",
        type: "grid",
        size: config.baseNodeSize * 3.5,
        description: "Centro de distribución de energía",
      },
      // Procesar hogares
      ...validData.homes.map((home, i) => ({
        id: `home-${i}`,
        name: `Hogar ${i + 1}`,
        type: "home",
        consumption: home.consumption || 0,
        size: config.baseNodeSize + Math.sqrt(home.consumption || 1) * 0.8,
        description: `Vivienda residencial con consumo de ${(
          home.consumption || 0
        ).toFixed(1)} kW`,
      })),
      // Procesar comercios
      ...validData.businesses.map((business, i) => ({
        id: `business-${i}`,
        name: `Comercio ${i + 1}`,
        type: "business",
        consumption: business.consumption || 0,
        size: config.baseNodeSize + Math.sqrt(business.consumption || 1) * 0.7,
        description: `Establecimiento comercial con consumo de ${(
          business.consumption || 0
        ).toFixed(1)} kW`,
      })),
      // Procesar industrias
      ...validData.industries.map((industry, i) => ({
        id: `industry-${i}`,
        name: `Industria ${i + 1}`,
        type: "industry",
        consumption: industry.consumption || 0,
        size: config.baseNodeSize + Math.sqrt(industry.consumption || 1) * 0.6,
        description: `Planta industrial con consumo de ${(
          industry.consumption || 0
        ).toFixed(1)} kW`,
      })),
    ];

    // Crear enlaces con grosor proporcionado al consumo de manera más equilibrada
    const networkLinks = networkNodes
      .filter((node) => node.id !== "grid")
      .map((node) => {
        // Escalar el ancho del enlace de forma más proporcional al consumo
        const minConsumption = 1;
        const maxConsumption = 100;
        const normalizedConsumption =
          (node.consumption || minConsumption) / maxConsumption;
        const width =
          config.minLinkWidth +
          normalizedConsumption * (config.maxLinkWidth - config.minLinkWidth);

        return {
          source: "grid",
          target: node.id,
          value: node.consumption || 1,
          width: Math.max(
            config.minLinkWidth,
            Math.min(config.maxLinkWidth, width)
          ),
          type: node.type, // Guardar el tipo para colorear
        };
      });

    // Calcular estadísticas de energía y establecer nodos/enlaces
    try {
      const energyStatsData = calculateEnergyStats(networkNodes);
      setEnergyStats(energyStatsData);
      setNodes(networkNodes);
      setLinks(networkLinks);
    } catch (error) {
      console.error("Error al procesar datos de red:", error);
      // Inicializar con valores vacíos en caso de error
      setEnergyStats(null);
      setNodes([]);
      setLinks([]);
    }
  }, [data]);

  // Función para determinar la forma según el tipo de nodo
  const getNodeSymbol = (d) => {
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

  // Función para posicionar nodos en un layout radial
  const applyRadialLayout = (nodes, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Agrupar nodos por tipo
    const nodesByType = {
      grid: nodes.filter((n) => n.type === "grid"),
      home: nodes.filter((n) => n.type === "home"),
      business: nodes.filter((n) => n.type === "business"),
      industry: nodes.filter((n) => n.type === "industry"),
    };

    // Posicionar el nodo de red en el centro
    nodesByType.grid.forEach((node) => {
      node.fx = centerX;
      node.fy = centerY;
    });

    // Posicionar cada tipo en su propio anillo
    const positionNodesInRing = (nodes, radius, startAngle, endAngle) => {
      nodes.forEach((node, i) => {
        // Distribuir uniformemente en el círculo
        const angle = startAngle + (i / nodes.length) * (endAngle - startAngle);
        // Añadir algo de variación al radio para evitar alineación perfecta
        const nodeRadius = radius * (0.9 + Math.random() * 0.2);

        // Establecer posición inicial
        node.x = centerX + nodeRadius * Math.cos(angle);
        node.y = centerY + nodeRadius * Math.sin(angle);
      });
    };

    // Posicionar cada tipo a diferentes distancias y sectores
    positionNodesInRing(nodesByType.home, 150, 0, 2 * Math.PI);
    positionNodesInRing(nodesByType.business, 250, 0, 2 * Math.PI);
    positionNodesInRing(nodesByType.industry, 350, 0, 2 * Math.PI);

    return nodes;
  };

  // Función para posicionar nodos en un layout sectorial
  const applySectorLayout = (nodes, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Agrupar nodos por tipo
    const nodesByType = {
      grid: nodes.filter((n) => n.type === "grid"),
      home: nodes.filter((n) => n.type === "home"),
      business: nodes.filter((n) => n.type === "business"),
      industry: nodes.filter((n) => n.type === "industry"),
    };

    // Posicionar el nodo de red en el centro
    nodesByType.grid.forEach((node) => {
      node.fx = centerX;
      node.fy = centerY;
    });

    // Asignar sectores específicos para cada tipo
    const sectors = {
      home: {
        startAngle: -Math.PI / 6,
        endAngle: (Math.PI * 2) / 3,
        minRadius: 120,
        maxRadius: 240,
      },
      business: {
        startAngle: (Math.PI * 2) / 3,
        endAngle: (Math.PI * 4) / 3,
        minRadius: 120,
        maxRadius: 240,
      },
      industry: {
        startAngle: (Math.PI * 4) / 3,
        endAngle: (Math.PI * 11) / 6,
        minRadius: 120,
        maxRadius: 240,
      },
    };

    // Posicionar nodos por tipo en su sector asignado
    Object.entries(sectors).forEach(([type, sector]) => {
      const typeNodes = nodesByType[type];

      typeNodes.forEach((node, i) => {
        // Distribuir uniformemente en el sector
        const angle =
          sector.startAngle +
          (i / typeNodes.length) * (sector.endAngle - sector.startAngle);

        // Variar el radio dentro del rango min-max, más consumo = más cerca del centro
        const normalizedIndex = i / (typeNodes.length || 1);
        const radiusRange = sector.maxRadius - sector.minRadius;
        const radius = sector.minRadius + normalizedIndex * radiusRange;

        // Establecer posición inicial
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
    });

    return nodes;
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
      .attr("class", "bg-gray-50 rounded-lg shadow-inner dark:bg-gray-800")
      .attr("ref", svgRef);

    // Agregar un fondo de cuadrícula sutil con mejor diseño
    const defs = svg.append("defs");

    // Patrón de cuadrícula mejorado
    const gridPattern = defs
      .append("pattern")
      .attr("id", "grid")
      .attr("width", 30)
      .attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");

    // Líneas horizontales
    gridPattern
      .append("path")
      .attr("d", "M 0 15 H 30")
      .attr("stroke", colorScheme.gridLines)
      .attr("stroke-width", 0.5);

    // Líneas verticales
    gridPattern
      .append("path")
      .attr("d", "M 15 0 V 30")
      .attr("stroke", colorScheme.gridLines)
      .attr("stroke-width", 0.5);

    // Aplicar el patrón de cuadrícula
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid)")
      .attr("fill-opacity", 0.5);

    // Aplicar layout inicial según el modo seleccionado
    const processedNodes = [...nodes];

    if (layoutMode === "radial") {
      applyRadialLayout(processedNodes, width, height);
    } else if (layoutMode === "sector") {
      applySectorLayout(processedNodes, width, height);
    }

    // Crear simulación de fuerzas mejorada
    const simulation = d3
      .forceSimulation(processedNodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => {
            // Distancia basada en el tipo y consumo
            let baseDist = 100;
            if (d.target.type === "home") baseDist = 150;
            if (d.target.type === "business") baseDist = 200;
            if (d.target.type === "industry") baseDist = 250;
            return baseDist + Math.sqrt(d.value) * 3;
          })
          .strength(config.linkStrength)
      )
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength((d) =>
            d.type === "grid"
              ? config.chargeStrength * 3
              : config.chargeStrength *
                (1 + (d.size / config.baseNodeSize) * 0.1)
          )
      )
      .force(
        "center",
        d3.forceCenter(width / 2, height / 2).strength(config.centerForce)
      )
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size * config.collisionRadius)
      );

    // Ajustes según el layout seleccionado
    if (layoutMode === "radial" || layoutMode === "sector") {
      // Fuerzas más relajadas para layouts predefinidos
      simulation.alpha(0.05);
    } else {
      // Más fuerzas para el layout de simulación pura
      simulation
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .alpha(0.5);
    }

    // Guardar la simulación para poder acceder a ella después
    window.networkSimulation = simulation;

    // Crear definiciones para efectos visuales
    // Añadir filtro de sombra
    const dropShadow = defs
      .append("filter")
      .attr("id", "shadow")
      .attr("filterUnits", "userSpaceOnUse")
      .attr("width", "250%")
      .attr("height", "250%");

    dropShadow
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 2)
      .attr("result", "blur");

    dropShadow
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 1)
      .attr("dy", 1)
      .attr("result", "offsetBlur");

    const feComponentTransfer = dropShadow
      .append("feComponentTransfer")
      .attr("in", "offsetBlur")
      .attr("result", "offsetBlur");

    feComponentTransfer
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.3);

    const feMerge = dropShadow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Gradientes para cada tipo de enlace
    const createLinkGradient = (id, color) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScheme.grid);

      gradient.append("stop").attr("offset", "100%").attr("stop-color", color);

      return gradient;
    };

    createLinkGradient("linkGradientHome", colorScheme.home);
    createLinkGradient("linkGradientBusiness", colorScheme.business);
    createLinkGradient("linkGradientIndustry", colorScheme.industry);

    // Filtro glow para nodos seleccionados con mejor efecto
    const glow = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");

    const feColorMatrix = glow
      .append("feColorMatrix")
      .attr("type", "matrix")
      .attr("values", "0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 1 0");

    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMergeGlow = glow.append("feMerge");
    feMergeGlow.append("feMergeNode").attr("in", "coloredBlur");
    feMergeGlow.append("feMergeNode").attr("in", "SourceGraphic");

    // Crear grupo para enlaces con animación
    const linkGroup = svg.append("g").attr("class", "links");

    // Crear enlaces con mayor calidad visual
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr(
        "stroke",
        (d) =>
          `url(#linkGradient${
            d.type.charAt(0).toUpperCase() + d.type.slice(1)
          })`
      )
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", (d) => d.width)
      .attr("stroke-linecap", "round");

    // Crear contenedor para nodos
    const nodeGroup = svg.append("g").attr("class", "nodes");

    // Crear nodos con mejor visualización
    const node = nodeGroup
      .selectAll("path")
      .data(processedNodes)
      .enter()
      .append("path")
      .attr("d", (d) => getNodeSymbol(d))
      .attr("fill", (d) => colorScheme[d.type])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("filter", "url(#shadow)")
      .attr("cursor", "pointer")
      .attr("opacity", 1)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Etiquetas mejoradas
    const labelGroup = svg.append("g").attr("class", "labels");

    // Criterio para mostrar etiquetas: nodos grandes o importantes
    const shouldShowLabel = (d) => {
      if (d.type === "grid") return true; // Siempre mostrar etiqueta para el nodo central
      if (d.type === "industry") return true; // Mostrar etiquetas para todas las industrias
      if (d.type === "business" && d.consumption > 15) return true; // Negocios grandes
      if (d.type === "home" && d.consumption > 10) return true; // Hogares grandes
      return false;
    };

    const labels = labelGroup
      .selectAll("text")
      .data(processedNodes.filter(shouldShowLabel))
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", (d) => (d.type === "grid" ? "12px" : "10px"))
      .attr("font-weight", (d) => (d.type === "grid" ? "bold" : "normal"))
      .attr("fill", colorScheme.text)
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("pointer-events", "none")
      .attr(
        "text-shadow",
        "0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff"
      );

    // Crear tooltip mejorado con más información
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-white p-3 rounded-lg shadow-lg text-sm z-10 dark:bg-gray-800 dark:text-white"
      )
      .style("pointer-events", "none")
      .style("max-width", "220px")
      .attr("ref", tooltipRef);

    // Mejorar eventos de interacción para nodos
    node
      .on("mouseover", function (event, d) {
        // Mostrar tooltip con diseño mejorado y más información
        tooltip
          .html(
            `
            <div class="font-bold text-base mb-1 text-gray-900 dark:text-white">${
              d.name
            }</div>
            <div class="text-gray-600 dark:text-gray-300 mb-2">${
              d.description || ""
            }</div>
            ${
              d.type !== "grid"
                ? `<div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Consumo:</span>
                <span class="font-medium">${
                  d.consumption?.toFixed(1) || 0
                } kW</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Tipo:</span>
                <span class="font-medium">${
                  d.type === "home"
                    ? "Residencial"
                    : d.type === "business"
                    ? "Comercial"
                    : "Industrial"
                }</span>
              </div>`
                : `<div class="text-gray-500 dark:text-gray-400 italic">Centro de distribución de energía</div>
                  <div class="mt-1 font-medium">Distribución total: ${
                    energyStats?.total.totalConsumption.toFixed(1) || 0
                  } kW</div>`
            }
          `
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 15 + "px")
          .classed("hidden", false);

        // Resaltar nodo activo
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#f8fafc")
          .attr("stroke-width", 2.5);

        // Resaltar enlaces conectados
        link
          .filter((l) => l.source.id === d.id || l.target.id === d.id)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", (l) => l.width * 2)
          .attr("stroke", colorScheme[d.type]);

        // Atenuar otros nodos
        node
          .filter((n) => n.id !== d.id && n.id !== "grid")
          .transition()
          .duration(200)
          .attr("opacity", 0.5);
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
          .attr("stroke", (l) => {
            // Determinar el gradiente a utilizar para el enlace de forma segura
            const typeKey =
              l.type === "home"
                ? "Home"
                : l.type === "business"
                ? "Business"
                : l.type === "industry"
                ? "Industry"
                : "";
            return typeKey
              ? `url(#linkGradient${typeKey})`
              : `url(#linkGradient)`;
          });

        // Restaurar opacidad de otros nodos
        node.transition().duration(200).attr("opacity", 1);
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
          .attr(
            "stroke",
            (l) =>
              `url(#linkGradient${
                l.type.charAt(0).toUpperCase() + l.type.slice(1)
              })`
          )
          .attr("stroke-opacity", 0.7)
          .attr("stroke-width", (d) => d.width);

        setSelectedNode(null);
      }
    });

    // Función de actualización más suave para el ticking
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
        .attr("stroke", "#f8fafc")
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

    // Leyenda mejorada con codificación de tamaño
    const legendData = [
      {
        type: "grid",
        label: "Red Eléctrica",
        description: "Fuente de distribución",
      },
      {
        type: "home",
        label: "Hogares",
        description: energyStats
          ? `${
              energyStats.homes.count
            } unidades, ${energyStats.homes.totalConsumption.toFixed(
              1
            )} kW total`
          : "Consumo residencial",
      },
      {
        type: "business",
        label: "Comercios",
        description: energyStats
          ? `${
              energyStats.businesses.count
            } unidades, ${energyStats.businesses.totalConsumption.toFixed(
              1
            )} kW total`
          : "Establecimientos comerciales",
      },
      {
        type: "industry",
        label: "Industrias",
        description: energyStats
          ? `${
              energyStats.industries.count
            } unidades, ${energyStats.industries.totalConsumption.toFixed(
              1
            )} kW total`
          : "Plantas industriales",
      },
    ];

    // Crear una leyenda con explicación de tamaño
    const legendWidth = 220;
    const legend = svg
      .append("g")
      .attr("transform", "translate(20, 20)")
      .attr("class", "legend");

    // Fondo con bordes suaves para la leyenda
    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendData.length * 25 + 70) // Espacio extra para la leyenda de tamaño
      .attr("fill", "white")
      .attr("fill-opacity", 0.9)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    // Título de la leyenda
    legend
      .append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#1f2937")
      .text("Leyenda");

    // Agregar elementos de la leyenda
    legendData.forEach((item, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(10, ${i * 25 + 35})`)
        .attr("cursor", "pointer");

      // Icono
      legendItem
        .append("path")
        .attr("d", getNodeSymbol({ ...item, size: 8 }))
        .attr("fill", colorScheme[item.type])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("transform", "scale(0.6)");

      // Texto principal
      legendItem
        .append("text")
        .text(item.label)
        .attr("x", 20)
        .attr("y", 4)
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("fill", "#374151");

      // Descripción
      legendItem
        .append("text")
        .text(item.description)
        .attr("x", 20)
        .attr("y", 18)
        .attr("font-size", "9px")
        .attr("fill", "#6b7280");

      // Interactividad de la leyenda
      legendItem
        .on("mouseover", function () {
          // Resaltar nodos de este tipo
          node
            .filter((d) => d.type === item.type)
            .transition()
            .duration(200)
            .attr("stroke", "#f8fafc")
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

          // Actualizar la simulación para centrar estos nodos
          simulation
            .force(
              "x",
              d3
                .forceX((d) =>
                  d.type === item.type
                    ? width / 2
                    : width / 2 + (Math.random() - 0.5) * 100
                )
                .strength((d) => (d.type === item.type ? 0.2 : 0.05))
            )
            .force(
              "y",
              d3
                .forceY((d) =>
                  d.type === item.type
                    ? height / 2
                    : height / 2 + (Math.random() - 0.5) * 100
                )
                .strength((d) => (d.type === item.type ? 0.2 : 0.05))
            )
            .alpha(0.5)
            .restart();
        });
    });

    // Añadir leyenda de tamaño de nodos
    const sizeY = legendData.length * 25 + 40;

    // Título para tamaños
    legend
      .append("text")
      .attr("x", 10)
      .attr("y", sizeY)
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "#4b5563")
      .text("Tamaño = Consumo de energía");

    // Ejemplos de tamaño
    [5, 20, 50].forEach((value, i) => {
      const x = 20 + i * 60;
      const radius = Math.sqrt(value) * 0.8;

      // Círculo para mostrar tamaño
      legend
        .append("circle")
        .attr("cx", x)
        .attr("cy", sizeY + 20)
        .attr("r", radius)
        .attr("fill", "#64748b")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "#475569")
        .attr("stroke-width", 1);

      // Etiqueta de valor
      legend
        .append("text")
        .attr("x", x)
        .attr("y", sizeY + 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("fill", "#4b5563")
        .text(`${value} kW`);
    });

    // Panel de controles de layout
    const controls = svg
      .append("g")
      .attr("transform", `translate(${width - 140}, 20)`)
      .attr("class", "controls");

    // Fondo para los controles
    controls
      .append("rect")
      .attr("width", 120)
      .attr("height", 100)
      .attr("fill", "white")
      .attr("fill-opacity", 0.9)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    // Título de los controles
    controls
      .append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#1f2937")
      .text("Configuración");

    // Botones de layout
    const layoutButtons = [
      { id: "radial", label: "Radial", x: 15, y: 40 },
      { id: "sector", label: "Sectorial", x: 65, y: 40 },
      { id: "force", label: "Disperso", x: 15, y: 70 },
    ];

    layoutButtons.forEach((btn) => {
      const button = controls
        .append("g")
        .attr("cursor", "pointer")
        .on("click", () => {
          setLayoutMode(btn.id);

          // Reiniciar posiciones según el layout seleccionado
          if (btn.id === "radial") {
            applyRadialLayout(processedNodes, width, height);
          } else if (btn.id === "sector") {
            applySectorLayout(processedNodes, width, height);
          } else {
            // Liberar todas las posiciones fijas
            processedNodes.forEach((node) => {
              if (node.id !== "grid") {
                node.fx = null;
                node.fy = null;
              }
            });
          }

          // Actualizar la simulación
          simulation.alpha(0.5).restart();
        });

      // Fondo del botón
      button
        .append("rect")
        .attr("x", btn.x)
        .attr("y", btn.y - 15)
        .attr("width", 45)
        .attr("height", 20)
        .attr("rx", 4)
        .attr("fill", layoutMode === btn.id ? "#3b82f6" : "#f1f5f9")
        .attr("stroke", layoutMode === btn.id ? "#2563eb" : "#cbd5e1")
        .attr("stroke-width", 1);

      // Texto del botón
      button
        .append("text")
        .attr("x", btn.x + 22.5)
        .attr("y", btn.y)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", layoutMode === btn.id ? "bold" : "normal")
        .attr("fill", layoutMode === btn.id ? "white" : "#475569")
        .text(btn.label);
    });

    // Controles de zoom
    const zoomControls = svg
      .append("g")
      .attr("transform", `translate(${width - 50}, 140)`)
      .attr("class", "zoom-controls");

    // Fondo para los controles de zoom
    zoomControls
      .append("rect")
      .attr("width", 30)
      .attr("height", 60)
      .attr("fill", "white")
      .attr("fill-opacity", 0.8)
      .attr("rx", 15)
      .attr("ry", 15)
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    // Botón zoom in
    const zoomIn = zoomControls
      .append("g")
      .attr("transform", "translate(15, 20)")
      .attr("cursor", "pointer");

    zoomIn
      .append("circle")
      .attr("r", 10)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1);

    zoomIn
      .append("line")
      .attr("x1", -5)
      .attr("y1", 0)
      .attr("x2", 5)
      .attr("y2", 0)
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1.5);

    zoomIn
      .append("line")
      .attr("x1", 0)
      .attr("y1", -5)
      .attr("x2", 0)
      .attr("y2", 5)
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1.5);

    // Botón zoom out
    const zoomOut = zoomControls
      .append("g")
      .attr("transform", "translate(15, 40)")
      .attr("cursor", "pointer");

    zoomOut
      .append("circle")
      .attr("r", 10)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1);

    zoomOut
      .append("line")
      .attr("x1", -5)
      .attr("y1", 0)
      .attr("x2", 5)
      .attr("y2", 0)
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1.5);

    // Implementar zoom
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        nodeGroup.attr("transform", event.transform);
        linkGroup.attr("transform", event.transform);
        labelGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Eventos para los botones de zoom
    zoomIn.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    zoomOut.on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    // Atajos de teclado mejorados
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
          if (d.id !== "grid") {
            d.fx = null;
            d.fy = null;
          }
        });
        simulation.alpha(1).restart();
      }

      // F fija todos los nodos en su posición actual
      if (event.key === "f") {
        nodes.forEach((d) => {
          d.fx = d.x;
          d.fy = d.y;
        });
      }

      // 1-3 para cambiar layouts
      if (event.key === "1") {
        setLayoutMode("radial");
        applyRadialLayout(processedNodes, width, height);
        simulation.alpha(0.3).restart();
      } else if (event.key === "2") {
        setLayoutMode("sector");
        applySectorLayout(processedNodes, width, height);
        simulation.alpha(0.3).restart();
      } else if (event.key === "3") {
        setLayoutMode("force");
        processedNodes.forEach((node) => {
          if (node.id !== "grid") {
            node.fx = null;
            node.fy = null;
          }
        });
        simulation.alpha(1).restart();
      }
    });

    // Añadir una animación inicial para la carga de los nodos
    node
      .attr("opacity", 0)
      .attr("transform", (d) => {
        // Todos empiezan desde el centro
        const centerX = width / 2;
        const centerY = height / 2;
        return `translate(${centerX}, ${centerY})`;
      })
      .transition()
      .delay((d, i) => i * 10)
      .duration(800)
      .attr("opacity", 1);

    // Actualizar dimensiones
    updateSvgSize();
  }, [nodes, links, selectedNode, layoutMode, energyStats, colorScheme]);

  if (!data) return null;

  return (
      <div className="flex flex-col w-full h-full bg-white shadow rounded-lg dark:bg-gray-800 relative">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-600 rounded-t-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Red de Distribución Eléctrica
        </h3>
        {/* Panel de información del nodo seleccionado - NUEVO */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-4 max-w-xs z-20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    selectedNode.type === "grid"
                      ? "bg-blue-500"
                      : selectedNode.type === "home"
                      ? "bg-green-500"
                      : selectedNode.type === "business"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedNode.name}
                </h4>
              </div>
              <button
                onClick={() => {
                  // Deseleccionar nodo y restaurar estilos
                  if (window.networkSimulation) {
                    const nodes = window.networkSimulation.nodes();
                    const links = window.networkSimulation
                      .force("link")
                      .links();

                    // Restaurar el nodo seleccionado
                    d3.select(containerRef.current)
                      .selectAll("path")
                      .filter((d) => d.id === selectedNode.id)
                      .transition()
                      .duration(300)
                      .attr("stroke", "#fff")
                      .attr("stroke-width", 1.5)
                      .attr("filter", "url(#shadow)");

                    // Restaurar todos los enlaces
                    d3.select(containerRef.current)
                      .selectAll("line")
                      .transition()
                      .duration(300)
                      .attr("stroke-opacity", 0.7)
                      .attr("stroke-width", (d) => d.width)
                      .attr("stroke", (l) => {
                        const typeKey =
                          l.type === "home"
                            ? "Home"
                            : l.type === "business"
                            ? "Business"
                            : l.type === "industry"
                            ? "Industry"
                            : "";
                        return typeKey
                          ? `url(#linkGradient${typeKey})`
                          : `url(#linkGradient)`;
                      });
                  }
                  setSelectedNode(null);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-gray-600 dark:text-gray-300">
                {selectedNode.description || "Sin descripción disponible"}
              </div>

              {selectedNode.type !== "grid" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Consumo:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedNode.consumption?.toFixed(1) || 0} kW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Tipo:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedNode.type === "home"
                        ? "Residencial"
                        : selectedNode.type === "business"
                        ? "Comercial"
                        : "Industrial"}
                    </span>
                  </div>
                </>
              )}

              {selectedNode.type === "grid" && energyStats && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Distribución total:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {energyStats.total.totalConsumption.toFixed(1)} kW
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Haz clic en otro nodo para cambiar la selección
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        id="network-container"
        className="w-full flex-grow relative"
        ref={containerRef}
        style={{ minHeight: "600px" }}
      ></div>
      <div className="flex justify-between items-center text-xs px-4 py-3 bg-gray-50 border-t dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 rounded-b-lg">
        <div className="flex items-center space-x-4">
          <span className="font-medium">Interacción:</span>
          <span>Clic = Seleccionar nodo</span>
          <span className="hidden sm:inline">• Arrastrar = Mover</span>
          <span className="hidden md:inline">
            • Shift+soltar = Fijar posición
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {selectedNode && (
            <div className="flex items-center bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
              <span className="text-xs font-medium">{selectedNode.name}</span>
            </div>
          )}
          <button
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            onClick={() => {
              if (window.networkSimulation) {
                const nodes = window.networkSimulation.nodes();
                nodes.forEach((d) => {
                  if (d.id !== "grid") {
                    d.fx = null;
                    d.fy = null;
                  }
                });
                window.networkSimulation.alpha(1).restart();
              }
            }}
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
