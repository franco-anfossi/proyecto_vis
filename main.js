// Suponiendo que tienes un archivo GeoJSON para el mapa mundial y un archivo CSV con los datos de salud mental

// Carga de datos GeoJSON y de salud mental
Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"), // Reemplaza con la ruta a tu archivo GeoJSON
    d3.csv("Mental Health Data.csv", function(d) {
        return {
            ...d, // otros campos
            porcentaje: parseFloat(d.porcentaje.replace(',', '.'))
        };
    })
]).then(function([worldData, healthData]) {
    // Procesamiento de los datos de salud mental
    // Aquí puedes calcular los promedios del año más actual

    // Una vez que tienes los datos procesados, llama a la función para crear el mapa
    createWorldMap(worldData, healthData);
});

function createWorldMap(worldData, healthData) {
    // Configuración básica del SVG y la proyección del mapa
    const margin = {top: 20, right: 20, bottom: 20, left: 20};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#vis-1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Creación del mapa
    svg.selectAll("path")
        .data(worldData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", function(d) {
            // Aquí determinas el color basándote en los datos de salud mental
            // Puedes usar una escala de colores y asociarla con los datos
            const countryData = healthData.find(h => h.CountryCode === d.properties.iso_a3);
            return countryData ? colorScale(countryData.YourDataField) : "#ccc";
        });

    // Aquí puedes añadir interactividad, como tooltips o eventos de clic
}

// Función para calcular promedios o procesar datos
function processData(healthData) {
    // Implementa el cálculo de promedios o el procesamiento necesario aquí
    // Retorna los datos procesados
}
