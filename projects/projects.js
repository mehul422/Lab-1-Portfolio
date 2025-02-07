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
    setTimeout(() => {
        const projectsTitle = document.querySelector('.projects-title');
        projectsTitle.textContent = `${projects.length} Projects`;
        renderProjects(projects, projectsContainer, 'h2');
        renderPieChart(projects); // Render initial pie chart
    }, 500);
}

let selectedIndex = -1; // Global index to track the selected slice
let query = ''; // Global search query

function renderPieChart(projectsGiven) {
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();
    
    let rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
    
    let pieData = rolledData.map(([year, count]) => ({ value: count, label: year }));
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(pieData);
    
    newSVG.selectAll('path')
      .data(arcData)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', (d, idx) => colors(idx))
      .on('click', function(event, d) {
        const i = arcData.indexOf(d);
        selectedIndex = selectedIndex === i ? -1 : i;

        newSVG.selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

        legend.selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

        let filteredProjects = projects;

        if (query) {
            filteredProjects = filteredProjects.filter(project => {
                let values = Object.values(project).join('\n').toLowerCase();
                return values.includes(query);
            });
        }

        if (selectedIndex !== -1) {
            const selectedYear = pieData[selectedIndex]?.label;
            if (selectedYear) {
                filteredProjects = filteredProjects.filter(project => project.year === selectedYear);
            }
        }

        renderProjects(filteredProjects, projectsContainer, 'h2');
    });
    
    arcData.forEach((d, idx) => {
      legend.append('li')
        .attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color:${colors(idx)};"></span> ${pieData[idx].label} <em>(${pieData[idx].value})</em>`);
    });
}

// Initial render
renderPieChart(projects);

// Implement search functionality
const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    let filteredProjects = projects.filter(project => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});