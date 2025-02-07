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
        renderPieChart(projects); // Render the pie chart for all projects initially
    }, 500); // Wait for 500ms before rendering the projects
}

// Function to render the pie chart
function renderPieChart(projectsGiven) {
  // Clear the previous chart
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Group projects by year and count the number of projects per year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length, // Count the number of projects in each year
    (d) => d.year,   // Group by the 'year' property
  );

  // Format the rolled data into an array of objects suitable for the pie chart
  let pieData = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let colors = d3.scaleOrdinal(d3.schemeTableau10); // Using the schemeTableau10 color scale

  // Arc generator function
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Pie chart data setup using d3.pie()
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(pieData); // arcData now contains objects with startAngle, endAngle, and value

  // Append the paths for each slice with the colors
  newSVG.selectAll('path')
    .data(arcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, idx) => colors(idx));

  // Create the legend for the pie chart
  arcData.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // Assign color as a CSS variable
          .html(`<span class="swatch"></span> ${pieData[idx].label} <em>(${pieData[idx].value})</em>`);
  });
}

// Search functionality
let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;

  // Filter projects based on the query
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Render filtered projects and the pie chart
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects); // Re-render the pie chart for filtered projects

  // Optional: Update the title to reflect the number of filtered projects
  const projectsTitle = document.querySelector('.projects-title');
  projectsTitle.textContent = `${filteredProjects.length} Projects`;
});

// Initially call the render function on page load
renderPieChart(projects);