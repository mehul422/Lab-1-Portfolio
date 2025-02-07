import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Add a loading message
const projectsContainer = document.querySelector('.projects');
projectsContainer.innerHTML = '<p>Loading projects...</p>'; // Temporary loading text

// Fetch the project data with cache busting
const projects = await fetchJSON(`https://mehul422.github.io/Lab-1-Portfolio/lib/projects.json?nocache=${Date.now()}`);

console.log("Total projects loaded:", projects.length); // Debugging output

// Clear loading text
projectsContainer.innerHTML = '';

// Ensure projects are fully loaded before updating UI
if (projects.length === 0) {
    console.error("No projects loaded. Retrying...");
} else {
    // Use a delay to give the browser time to fully load
    setTimeout(() => {
        // Select the projects-title element
        const projectsTitle = document.querySelector('.projects-title');
        projectsTitle.textContent = `${projects.length} Projects`;

        // Render the projects
        renderProjects(projects, projectsContainer, 'h2');
    }, 500); // Wait for 500ms before rendering the projects
}

let colors = d3.scaleOrdinal(d3.schemeTableau10); // Using the schemeTableau10 color scale

// Arc generator function
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Pie chart data
let data = [
    { value: 1, label: 'apples' },
    { value: 2, label: 'oranges' },
    { value: 3, label: 'mangos' },
    { value: 4, label: 'pears' },
    { value: 5, label: 'limes' },
    { value: 5, label: 'cherries' },
  ];

// Use d3.pie() to generate start and end angles
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data); // arcData now contains objects with startAngle, endAngle, and value

// Generate the arcs for each slice
let arcs = arcData.map(d => arcGenerator(d)); // Pass the arc data to arcGenerator to get the path

// Append the paths for each slice with the colors
arcs.forEach((arc, idx) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(idx)); // Use colors function to get the color for each slice
});

// Select the legend container (Make sure there's a <ul class="legend"> in your HTML)
let legend = d3.select('.legend');

// Append legend items for each slice
data.forEach((d, idx) => {
    let legendItem = legend.append('li') 
                           .attr('class', 'legend-item');

    // Append the color swatch
    legendItem.append('span')
              .attr('class', 'swatch')
              .style('background-color', colors(idx)); // Set background color directly

    // Append the text label
    legendItem.append('span')
              .text(`Slice ${idx + 1}: ${d}`);
});


