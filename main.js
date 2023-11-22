// Constantes
const WIDTH = 1300;
const HEIGHT = 1000;
const MARGIN = { 
    top: 20,
    right: 50,
    bottom: 20,
    left: 50
};

const width = WIDTH - MARGIN.left - MARGIN.right;
const height = HEIGHT - MARGIN.top - MARGIN.bottom;

// SVG
const svg1 = d3
    .select("#vis-1")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

// G
const contenedorMapa = svg1
    .append("g")
    .attr("id", "mapa")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

// Define la función de zoom y el evento
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // Esto define los límites del zoom (min, max)
    .translateExtent([[0, 0], [width, height]]) // Esto restringe el pan dentro del área del mapa
    .on('zoom', (event) => {
        contenedorMapa.attr('transform', event.transform);
    });

// Aplica la función de zoom al SVG
svg1.call(zoom);

// Función para procesar los datos CSV
function procesarDatosCSV(d) {
    const schizophrenia = +d["Schizophrenia (%)"];
    const bipolar = +d["Bipolar disorder (%)"];
    const eating = +d["Eating disorders (%)"];
    const anxiety = +d["Anxiety disorders (%)"];
    const drug = +d["Drug use disorders (%)"];
    const depressive = +d["Depression (%)"]; 
    const alcohol = +d["Alcohol use disorders (%)"];

    // Calcula el promedio de los porcentajes
    let promedio = (
        schizophrenia + bipolar + 
        eating + anxiety + drug + 
        depressive + alcohol
    ) / 7;

    // Redondear a tres decimales y convertir a número
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

// Cargar datos y crear mapa
d3.json("data/countries.geojson").then((datosMapa) => {
    d3.csv("data/Mental Health Data1.csv", procesarDatosCSV).then((datosCSV) => {
        // Encuentra el año más reciente y filtra los datos para ese año
        const ultimoAno = d3.max(datosCSV, d => d.Year);
        const datosFiltrados = datosCSV.filter(d => d.Year === ultimoAno);
        crearMapa(datosMapa, datosFiltrados, datosCSV);
    });
});

function crearMapa(datosMapa, datosFiltrados, datosCSV) {
    const proyeccion = d3
        .geoMercator().
        fitSize([width, height], datosMapa);

    const caminosGeo = d3
        .geoPath()
        .projection(proyeccion);

    // Escala de colores basada en el promedio
    const escalaColores = d3.scaleSequential(d3.interpolateReds)
        .domain(d3.extent(datosFiltrados, d => d.Promedio));

    // Dibujar mapa
    contenedorMapa.selectAll("path")
        .data(datosMapa.features)
        .enter()
        .append("path")
        .attr("d", caminosGeo)
        .attr("fill", function(d) {
            const datoPais = datosFiltrados.find(p => p.Code === d.properties.ISO_A3);
            return datoPais ? escalaColores(datoPais.Promedio) : "#ccc";
        })
        .on("mouseover", function(event, d) {
            const datoPais = datosFiltrados.find(p => p.Code === d.properties.ISO_A3);
            if (datoPais) {
                d3.select("#tooltip")
                    .style("visibility", "visible")
                    .html(
                        `<strong>${datoPais.Entity}</strong><br>
                        Schizophrenia: ${datoPais.Schizophrenia.toFixed(3)}%<br>
                        Bipolar Disorder: ${datoPais.Bipolar.toFixed(3)}%<br>
                        Eating Disorders: ${datoPais.Eating.toFixed(3)}%<br>
                        Anxiety Disorders: ${datoPais.Anxiety.toFixed(3)}%<br>
                        Drug Use Disorders: ${datoPais.Drug.toFixed(3)}%<br>
                        Depressive Disorders: ${datoPais.Depressive.toFixed(3)}%<br>
                        Alcohol Use Disorders: ${datoPais.Alcohol.toFixed(3)}%<br>
                        Average Mental Health Disorders: ${datoPais.Promedio}%<br>`
                    )
                    .style("left", (event.pageX + 10) + "px") 
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mousemove", function(event) {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("visibility", "hidden");
        })
        .on('click', function(event, d) {
            // Suponiendo que el código del país está en 'd.properties.ISO_A3'
            const codigoPais = d.properties.ISO_A3;
            mostrarEvolucion(codigoPais, datosCSV);
        });

    function mostrarEvolucion(codigoPais, datosCSV) {
        // Filtra y ordena los datos para el país seleccionado
        const datosHistoricos = datosCSV.filter(d => d.Code === codigoPais)
                                        .sort((a, b) => d3.ascending(a.Year, b.Year));
        
        // Verifica que los datos filtrados son correctos
        console.log(datosHistoricos); // Deberías ver los datos del país seleccionado
    
        // Llama a la función para dibujar el gráfico
        dibujarGrafico(datosHistoricos);
    }
    
    // Función para dibujar el gráfico de líneas en #vis-2
    function dibujarGrafico(datosHistoricos) {
        // Borra cualquier gráfico anterior
        d3.select('#vis-2').html('');
    
        // Define el tamaño y los márgenes del gráfico
        const margin = { top: 50, right: 30, bottom: 30, left: 60 },
              width = 1000 - margin.left - margin.right,
              height = 800 - margin.top - margin.bottom;
    
        // Añade el SVG al contenedor
        const svg2 = d3.select("#vis-2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Añade las escalas X e Y
        const x = d3.scaleLinear()
            .domain(d3.extent(datosHistoricos, d => d.Year))
            .range([0, width]);
    
        svg2.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        // Encuentra el valor máximo entre todos los trastornos
        const maxDisorderValue = d3.max(datosHistoricos, d => 
            Math.max(d.Schizophrenia, d.Bipolar, d.Eating, d.Anxiety, d.Drug, d.Depressive, d.Alcohol));
    
        // Ajusta la escala Y para el valor máximo encontrado
        const y = d3.scaleLinear()
            .domain([0, maxDisorderValue])
            .range([height, 0]);
    
        // Añade el eje Y al gráfico
        svg2.append("g")
            .call(d3.axisLeft(y));
    
        // Colores para cada trastorno
        const colors = d3.scaleOrdinal(d3.schemeCategory10);
    
        // Función para crear una línea
        const createLine = disorder => d3.line()
            .x(d => x(d.Year))
            .y(d => y(d[disorder]));
    
        const disorders = ["Schizophrenia", "Bipolar", "Eating", "Anxiety", "Drug", "Depressive", "Alcohol"];
    
        // Utiliza map y join para crear líneas y círculos para cada trastorno
        disorders.map((disorder, i) => {
            // Crea la línea para el trastorno actual
            svg2.append("path")
                .datum(datosHistoricos)
                .attr("fill", "none")
                .attr("stroke", colors(i))
                .attr("stroke-width", 2.5)
                .attr("d", createLine(disorder));
    
            // Crea círculos para el trastorno actual
            svg2.selectAll(".circle-" + disorder)
                .data(datosHistoricos)
                .join("circle")
                .attr("class", "circle-" + disorder)
                .attr("fill", colors(i))
                .attr("stroke", colors(i))
                .attr("r", 4)
                .attr("cx", d => x(d.Year))
                .attr("cy", d => y(d[disorder]))
                .on("mouseover", function(event, d) {
                    d3.select("#tooltip")
                        .style("visibility", "visible")
                        .html(`Año: ${d.Year}<br>${disorder} Disorder: ${d[disorder].toFixed(3)}%`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select("#tooltip").style("visibility", "hidden");
                });
        });
    
        // Crear un grupo para la leyenda
        const leyenda = svg2.append("g")
            .attr("class", "leyenda")
            .attr("transform", `translate(0, ${-10})`);

        let leyendaX = 0; // Posición inicial para los elementos de la leyenda
        const baseWidth = "Schizophrenia".length * 10 + 10; // Longitud de referencia para el ancho de la leyenda

        // Crear elementos de leyenda
        disorders.map((disorder, i) => {
            const leyendaItem = leyenda.append("g")
                .attr("transform", `translate(${leyendaX}, 0)`);

            leyendaItem.append("circle")
                .attr("cx", 0)
                .attr("cy", -20)
                .attr("r", 7)
                .style("fill", colors(i));

            leyendaItem.append("text")
                .attr("x", 15)
                .attr("y", -20)
                .attr("dy", ".35em")
                .style("text-anchor", "start")
                .text(disorder);

            leyendaX += baseWidth; // Actualiza la posición para el siguiente elemento de la leyenda
        });
    }
}