// ------------------------- Constantes SVG1 -------------------------
const WIDTH1 = 1300;
const HEIGHT1 = 800;
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

// Variables globales SVG2 (ejes, colores, trastornos)
const colors = d3.scaleOrdinal(d3.schemeCategory10);
const x = d3.scaleLinear().range([0, width2]);
const y = d3.scaleLinear().range([height2, 0]);

const trastornos = [
    { ingles: "Schizophrenia", espanol: "Esquizofrenia" },
    { ingles: "Bipolar", espanol: "Bipolar" },
    { ingles: "Eating", espanol: "Alimenticios" },
    { ingles: "Anxiety", espanol: "Ansiedad" },
    { ingles: "Drug", espanol: "Drogas" },
    { ingles: "Depressive", espanol: "Depresivos" },
    { ingles: "Alcohol", espanol: "Alcohol" }
];

// Crear leyenda
const leyenda = svg2.append("g")
    .attr("class", "leyenda")
    .attr("transform", `translate(0, ${-10})`);

crearLeyenda();

// ------------------------- Definicion de Botones -------------------------

trastornos.map(trastorno => {
    d3.select(`#btn${trastorno.espanol}`).on("click", () => cambiarTrastorno(trastorno.ingles));
});

d3.select("#btnPromedio").on("click", () => cambiarTrastorno("Promedio"));
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
        dibujarGrafico(datosHistoricos, true);
    }
}

function mostrarEvolucionCantidad() {
    if (codigoPaisSeleccionado) {
        const datosHistoricos = filtrarYOrdenarDatosDeTrastornos();
        const datosCantidad = combinarYCalcularCantidad(datosHistoricos);
        dibujarGrafico(datosCantidad, false);
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

// -----> Funcion de dibujo de grafico SVG2
function dibujarGrafico(datosGenerales, esPorcentual) {
    x.domain(d3.extent(datosGenerales, d => d.Year));
    y.domain([0, d3.max(datosGenerales, d => 
        Math.max(d.Schizophrenia, d.Bipolar, d.Eating, d.Anxiety, d.Drug, d.Depressive, d.Alcohol))
    ]);

    svg2.select(".eje-x").call(d3.axisBottom(x));
    svg2.select(".eje-y")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y));

    const createLine = disorder => d3.line()
        .x(d => x(d.Year))
        .y(d => y(d[disorder]));

    trastornos.map((trastorno, index) => {
        actualizarLineaYCirculos(trastorno.ingles, datosGenerales, colors(index), esPorcentual);
    });

    function actualizarLineaYCirculos(trastorno, datos, color, esPorcentual) {
        svg2.selectAll(".line-" + trastorno)
            .data([datos])
            .join("path")
            .attr("class", "line-" + trastorno)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2.5)
            .transition()
            .duration(1000)
            .attr("d", createLine(trastorno));
        
        const circulos = svg2.selectAll(".circle-" + trastorno)
            .data(datos, d => d.Year);
    
        circulos.enter()
            .append("circle")
            .attr("class", "circle-" + trastorno)
            .attr("r", 4)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[trastorno]))
            .on("mouseover", (event, d) => mouseover(event, d, trastorno, esPorcentual))
            .on("mouseout", mouseout)
            .transition()
            .duration(1000)
            .attr("cy", d => y(d[trastorno]));
    
        circulos
            .on("mouseover", (event, d) => mouseover(event, d, trastorno, esPorcentual))
            .on("mouseout", mouseout)
            .transition()
            .duration(1000)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[trastorno]));
    
        circulos.exit()
            .transition()
            .duration(1000)
            .attr("cy", d => y(0))
            .remove();
    
        function mouseover(event, d, trastorno, isPorcentual) {
            d3.select("#tooltip")
                .style("visibility", "visible")
                .html(`Año: ${d.Year}<br>
                    ${isPorcentual ? "Porcentaje: " + d[trastorno].toFixed(3) + '%' : 
                    "Cantidad: " + d[trastorno].toFixed(0) + ' personas'}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");
        }
    
        function mouseout() {
            d3.select("#tooltip").style("visibility", "hidden");
        }
    }
}

// -----> Funcion de creacion de leyenda SVG2
function crearLeyenda() {
    const baseWidth = "Esquizofrenia".length * 10 + 10;
    trastornos.map((trastorno, index) => {
        agregarElementoLeyenda(trastorno.espanol, colors(index), index * baseWidth);
    });

    function agregarElementoLeyenda(trastorno, color, posX) {
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
            .text(trastorno);
    }
}