// ------------------------- Constantes SVG1 -------------------------
const WIDTH1 = 1300;
const HEIGHT1 = 1000;
const MARGIN1 = { 
    top: 20,
    right: 50,
    bottom: 20,
    left: 50
};

const widthOne = WIDTH1 - MARGIN1.left - MARGIN1.right;
const heightOne = HEIGHT1 - MARGIN1.top - MARGIN1.bottom;

// ------------------------- Constantes SVG2 -------------------------
const WIDTH2 = 1000;
const HEIGHT2 = 800;
const MARGIN2 = { 
    top: 50, 
    right: 30, 
    bottom: 30, 
    left: 60 
};
const width2 = WIDTH2 - MARGIN2.left - MARGIN2.right;
const height2 = HEIGHT2 - MARGIN2.top - MARGIN2.bottom;

// ------------------------- Variables globales -------------------------
let datosMentalCSV;
let datosMapa;
let datosPopulationCSV;
let codigoPaisSeleccionado = null;

// ------------------------- SVG1 -------------------------
const svg1 = d3
    .select("#vis-1")
    .append("svg")
    .attr("width", WIDTH1)
    .attr("height", HEIGHT1);

// Contenedor para el mapa
const contenedorMapa = svg1
    .append("g")
    .attr("id", "mapa")
    .attr("transform", `translate(${MARGIN1.left}, ${MARGIN1.top})`);

// Zoom
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [widthOne, heightOne]])
    .on('zoom', (event) => {
        contenedorMapa.attr('transform', event.transform);
});

// Aplicar zoom a SVG1
svg1.call(zoom);

// ------------------------- SVG2 -------------------------

const svg2 = d3.select("#vis-2")
    .append("svg")
    .attr("width", width2 + MARGIN2.left + MARGIN2.right)
    .attr("height", height2 + MARGIN2.top + MARGIN2.bottom)
    .append("g")
    .attr("transform", `translate(${MARGIN2.left},${MARGIN2.top})`);

svg2.append("g")
    .attr("transform", `translate(0,${height2})`)
    .attr("class", "eje-x");

svg2.append("g")
    .attr("class", "eje-y");

// Variables globales SVG2 (ejes y colores)
const colors = d3.scaleOrdinal(d3.schemeCategory10);
const x = d3.scaleLinear().range([0, width2]);
const y = d3.scaleLinear().range([height2, 0]);

// Crear leyenda
const leyenda = svg2.append("g")
    .attr("class", "leyenda")
    .attr("transform", `translate(0, ${-10})`);

crearLeyenda();

// ------------------------- Definicion de Botones -------------------------
d3.select("#btnPromedio").on("click", () => cambiarTrastorno("Promedio"));
d3.select("#btnSchizophrenia").on("click", () => cambiarTrastorno("Schizophrenia"));
d3.select("#btnBipolar").on("click", () => cambiarTrastorno("Bipolar"));
d3.select("#btnEating").on("click", () => cambiarTrastorno("Eating"));
d3.select("#btnAnxiety").on("click", () => cambiarTrastorno("Anxiety"));
d3.select("#btnDrug").on("click", () => cambiarTrastorno("Drug"));
d3.select("#btnDepressive").on("click", () => cambiarTrastorno("Depressive"));
d3.select("#btnAlcohol").on("click", () => cambiarTrastorno("Alcohol"));

d3.select("#btnPorcentual").on("click", mostrarEvolucionPorcentual);
d3.select("#btnCantidad").on("click", mostrarEvolucionCantidad);

// ------------------------------------------- Funciones -------------------------------------------

// -----> Procesamiento de datos
function procesarDatosMentalCSV(d) {
    const schizophrenia = +d["Schizophrenia (%)"];
    const bipolar = +d["Bipolar disorder (%)"];
    const eating = +d["Eating disorders (%)"];
    const anxiety = +d["Anxiety disorders (%)"];
    const drug = +d["Drug use disorders (%)"];
    const depressive = +d["Depression (%)"]; 
    const alcohol = +d["Alcohol use disorders (%)"];

    // Promedio trastornos
    let promedio = (
        schizophrenia + bipolar + 
        eating + anxiety + drug + 
        depressive + alcohol
    ) / 7;

    promedio = Number(promedio.toFixed(3));

    return {
        ID: +d.index,
        Entity: d.Entity,
        Code: d.Code,
        Year: +d.Year,
        Schizophrenia: schizophrenia,
        Bipolar: bipolar,
        Eating: eating,
        Anxiety: anxiety,
        Drug: drug,
        Depressive: depressive,
        Alcohol: alcohol,
        Promedio: promedio
    }
}

function procesarDatosPopulationCSV(d) {
    return {
        ID: +d.index,
        Entity: d.Entity,
        Code: d.Code,
        Year: +d.Year,
        Population: +d.Population
    }
}

// -----> Cargar datos
d3.json("data/countries.geojson").then((mapData) => {
    datosMapa = mapData;
    d3.csv("data/Mental Health Data.csv", procesarDatosMentalCSV).then((csvData) => {
        datosMentalCSV = csvData;
        cambiarTrastorno("Promedio");
    });
});

d3.csv("data/Aproximated World Population.csv", procesarDatosPopulationCSV).then((csvData) => {
    datosPopulationCSV = csvData;
});

// -----> Funcion de eleccion de trastorno por boton
function cambiarTrastorno(trastornoSeleccionado) {
    const ultimoAno = d3.max(datosMentalCSV, d => d.Year);
    const datosFiltrados = datosMentalCSV.filter(d => d.Year === ultimoAno);
    crearMapa(datosFiltrados, trastornoSeleccionado);
}

// -----> Funcion de creacion de mapa mundi (parte de este codigo fue tomado de la ayudantia de Grafos y Mapas)
function crearMapa(datosFiltrados, trastorno) {
    const proyeccion = d3
        .geoMercator()
        .fitSize([widthOne, heightOne], datosMapa);

    const caminosGeo = d3
        .geoPath()
        .projection(proyeccion);

    const maxValor = d3.max(datosFiltrados, d => d[trastorno]);
    const escalaColores = d3.scaleSequential(d3.interpolateReds)
        .domain([0, maxValor]);

    // aplicacion de datos al mapa y animacion de cambio
    contenedorMapa.selectAll("path")
        .data(datosMapa.features)
        .join(
            enter => enter
                .append("path")
                .attr("d", caminosGeo)
                .attr("fill", d => obtenerColor(d, datosFiltrados, trastorno, escalaColores))
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout)
                .on("click", click),
            update => update
                .transition()
                .duration(1000)
                .attr("fill", d => obtenerColor(d, datosFiltrados, trastorno, escalaColores)),
            exit => exit.remove()
        );

    // Función para obtener el color de un país
    function obtenerColor(d, datosFiltrados, trastorno, escalaColores) {
        const datoPais = datosFiltrados.find(p => p.Code === d.properties.ISO_A3);
        return datoPais ? escalaColores(datoPais[trastorno]) : "#ccc";
    }

    function mouseover(event, d) {
        const datoPais = datosFiltrados.find(p => p.Code === d.properties.ISO_A3);
        if (datoPais) {
            d3.select("#tooltip")
                .style("visibility", "visible")
                .html(
                    `<strong>${datoPais.Entity}</strong><br>
                    Esquizofrenia: ${datoPais.Schizophrenia.toFixed(3)}%<br>
                    Trastorno Bipolar: ${datoPais.Bipolar.toFixed(3)}%<br>
                    Trastornos Alimenticios: ${datoPais.Eating.toFixed(3)}%<br>
                    Trastornos de Ansiedad: ${datoPais.Anxiety.toFixed(3)}%<br>
                    Trastornos Depresivos: ${datoPais.Depressive.toFixed(3)}%<br>
                    Trastornos por Drogas: ${datoPais.Drug.toFixed(3)}%<br>
                    Trastornos por Alcohol: ${datoPais.Alcohol.toFixed(3)}%<br>
                    Trastornos Promedio: ${datoPais.Promedio}%<br>`
                )
                .style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY - 30) + "px");
        }
    }

    function mousemove(event) {
        d3.select("#tooltip")
            .style("left", (event.pageX + 10) + "px") 
            .style("top", (event.pageY - 30) + "px");
    }

    function mouseout() {
        d3.select("#tooltip").style("visibility", "hidden");
    }

    function click(event, d) {
        codigoPaisSeleccionado = d.properties.ISO_A3; // Guarda el código del país seleccionado
        mostrarEvolucionPorcentual();
    }
}

// -----> Funcion de cambio de grafico SVG2 por boton
function mostrarEvolucionPorcentual() {
    if (codigoPaisSeleccionado) {
        const datosHistoricos = filtrarYOrdenarDatosDeTrastornos();
        dibujarGraficoPorcentual(datosHistoricos);
    }
}

function mostrarEvolucionCantidad() {
    if (codigoPaisSeleccionado) {
        const datosHistoricos = filtrarYOrdenarDatosDeTrastornos();
        const datosCantidad = combinarYCalcularCantidad(datosHistoricos);
        dibujarGraficoCantidad(datosCantidad);
    }
}

function filtrarYOrdenarDatosDeTrastornos(){
    const datosHistoricos = datosMentalCSV.filter(d => d.Code === codigoPaisSeleccionado)
        .sort((a, b) => d3.ascending(a.Year, b.Year));

    return datosHistoricos;
}

// -----> Funcion de combinacion de datos de trastornos y poblacion
function combinarYCalcularCantidad(datosHistoricos) {
    // Con esto obtenemos la cantidad de personas afectadas por pais y año
    return datosHistoricos.map(d => {
        const datoPoblacion = datosPopulationCSV
            .find(p => p.Code === codigoPaisSeleccionado && p.Year === d.Year);

        return {
            Year: d.Year,
            Schizophrenia: datoPoblacion ? d.Schizophrenia * datoPoblacion.Population / 100 : 0,
            Bipolar: datoPoblacion ? d.Bipolar * datoPoblacion.Population / 100 : 0,
            Eating: datoPoblacion ? d.Eating * datoPoblacion.Population / 100 : 0,
            Anxiety: datoPoblacion ? d.Anxiety * datoPoblacion.Population / 100 : 0,
            Drug: datoPoblacion ? d.Drug * datoPoblacion.Population / 100 : 0,
            Depressive: datoPoblacion ? d.Depressive * datoPoblacion.Population / 100 : 0,
            Alcohol: datoPoblacion ? d.Alcohol * datoPoblacion.Population / 100 : 0,
        };
    });
}

// -----> Funcion de dibujo de grafico porcentual SVG2
function dibujarGraficoPorcentual(datosHistoricos) {
    x.domain(d3.extent(datosHistoricos, d => d.Year));
    y.domain([0, d3.max(datosHistoricos, d => 
        Math.max(d.Schizophrenia, d.Bipolar, d.Eating, d.Anxiety, d.Drug, d.Depressive, d.Alcohol))
    ]);

    // Actualizar ejes
    svg2.select(".eje-x").call(d3.axisBottom(x));
    svg2.select(".eje-y")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y));

    // Colores para cada trastorno
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // Función para crear una línea
    const createLine = disorder => d3.line()
        .x(d => x(d.Year))
        .y(d => y(d[disorder]));

    actualizarLineaYCirculos("Schizophrenia", datosHistoricos, colors(0));
    actualizarLineaYCirculos("Bipolar", datosHistoricos, colors(1));
    actualizarLineaYCirculos("Eating", datosHistoricos, colors(2));
    actualizarLineaYCirculos("Anxiety", datosHistoricos, colors(3));
    actualizarLineaYCirculos("Drug", datosHistoricos, colors(4));
    actualizarLineaYCirculos("Depressive", datosHistoricos, colors(5));
    actualizarLineaYCirculos("Alcohol", datosHistoricos, colors(6));

    function actualizarLineaYCirculos(disorder, datos, color) {
        // Actualizar la línea
        svg2.selectAll(".line-" + disorder)
            .data([datos])
            .join("path")
            .attr("class", "line-" + disorder)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2.5)
            .transition()
            .duration(1000)
            .attr("d", createLine(disorder));

        // Actualizar los círculos
        const circulos = svg2.selectAll(".circle-" + disorder)
            .data(datos, d => d.Year);  // Key function for object constancy

        circulos.enter()
            .append("circle")
            .attr("class", "circle-" + disorder)
            .attr("r", 4)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[disorder]))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .transition()
            .duration(1000)
            .attr("cy", d => y(d[disorder]));
    
        circulos
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .transition()
            .duration(1000)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[disorder]));
    
        circulos.exit()
            .transition()
            .duration(1000)
            .attr("cy", d => y(0))
            .remove();
    
        function mouseover(event, d) {
            d3.select("#tooltip")
                .style("visibility", "visible")
                .html(`Año: ${d.Year}<br>${disorder} Disorder: ${d[disorder].toFixed(3)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }
    
        function mouseout() {
            d3.select("#tooltip").style("visibility", "hidden");
        }
    }
}

function dibujarGraficoCantidad(datosCantidad) {
    // Configurar las escalas de acuerdo con los datos de cantidad
    x.domain(d3.extent(datosCantidad, d => d.Year));
    y.domain([0, d3.max(datosCantidad, d => 
        Math.max(d.Schizophrenia, d.Bipolar, d.Eating, d.Anxiety, d.Drug, d.Depressive, d.Alcohol))
    ]);

    // Actualizar ejes
    svg2.select(".eje-x").call(d3.axisBottom(x));
    svg2.select(".eje-y")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y));

    // Colores para cada trastorno
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // Función para crear una línea
    const createLine = disorder => d3.line()
        .x(d => x(d.Year))
        .y(d => y(d[disorder]));

    // Actualizar o crear líneas y círculos para cada trastorno
    actualizarLineaYCirculosCantidad("Schizophrenia", datosCantidad, colors(0));
    actualizarLineaYCirculosCantidad("Bipolar", datosCantidad, colors(1));
    actualizarLineaYCirculosCantidad("Eating", datosCantidad, colors(2));
    actualizarLineaYCirculosCantidad("Anxiety", datosCantidad, colors(3));
    actualizarLineaYCirculosCantidad("Drug", datosCantidad, colors(4));
    actualizarLineaYCirculosCantidad("Depressive", datosCantidad, colors(5));
    actualizarLineaYCirculosCantidad("Alcohol", datosCantidad, colors(6));

    function actualizarLineaYCirculosCantidad(disorder, datos, color) {
        // Aquí, repite la lógica de actualizarLineaYCirculos de dibujarGraficoPorcentual
        // pero adaptándola para los datos de cantidad

        // Actualizar la línea
        svg2.selectAll(".line-" + disorder)
            .data([datos])
            .join("path")
            .attr("class", "line-" + disorder)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2.5)
            .transition()
            .duration(1000)
            .attr("d", createLine(disorder));

        // Actualizar los círculos
        const circulos = svg2.selectAll(".circle-" + disorder)
            .data(datos, d => d.Year);  // Key function for object constancy

        circulos.enter()
            .append("circle")
            .attr("class", "circle-" + disorder)
            .attr("r", 4)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[disorder]))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .transition()
            .duration(1000)
            .attr("cy", d => y(d[disorder]));

        circulos
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .transition()
            .duration(1000)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[disorder]));

        circulos.exit()
            .transition()
            .duration(1000)
            .attr("cy", d => y(0))
            .remove();

        function mouseover(event, d) {
            d3.select("#tooltip")
                .style("visibility", "visible")
                .html(`Año: ${d.Year}<br>${disorder} Disorder: ${d[disorder].toFixed(0)} personas`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function mouseout() {
            d3.select("#tooltip").style("visibility", "hidden");
        }
    }
}


function crearLeyenda() {
    let leyendaX = 0;
    const baseWidth = "Schizophrenia".length * 10 + 10;
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    agregarElementoLeyenda("Schizophrenia", colors(0), leyendaX);
    leyendaX += baseWidth;
    agregarElementoLeyenda("Bipolar", colors(1), leyendaX);
    leyendaX += baseWidth;
    agregarElementoLeyenda("Eating", colors(2), leyendaX);
    leyendaX += baseWidth;
    agregarElementoLeyenda("Anxiety", colors(3), leyendaX);
    leyendaX += baseWidth;
    agregarElementoLeyenda("Drug", colors(4), leyendaX);
    leyendaX += baseWidth;
    agregarElementoLeyenda("Depressive", colors(5), leyendaX);
    leyendaX += baseWidth;
    agregarElementoLeyenda("Alcohol", colors(6), leyendaX);
    leyendaX += baseWidth;

    function agregarElementoLeyenda(disorder, color, posX) {
        const leyendaItem = leyenda.append("g")
            .attr("transform", `translate(${posX}, 0)`);

        leyendaItem.append("circle")
            .attr("cx", 0)
            .attr("cy", -20)
            .attr("r", 7)
            .style("fill", color);

        leyendaItem.append("text")
            .attr("x", 15)
            .attr("y", -20)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(disorder);
    }
}