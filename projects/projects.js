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

// Declare selectedIndex outside the function so it's accessible globally
let selectedIndex = -1; // Global index to track the selected slice

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
      .attr('fill', (d, idx) => colors(idx))
      .on('click', function(event, d) { // Remove `i` and use `this`
        // `this` will be the current `path` element, and `d` is the data bound to it
        const i = arcData.indexOf(d); // Get the index from arcData
  
        console.log('Clicked wedge index (i):', i);
        console.log('Clicked data:', d);
  
        // Ensure `selectedIndex` is within the bounds of the pieData
        if (i >= 0 && i < pieData.length) {
          selectedIndex = selectedIndex === i ? -1 : i;
        } else {
          console.error('Invalid selectedIndex:', i);
        }
  
        // Highlight the selected arc and update the legend
        newSVG.selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');  // Highlight selected arc
  
        legend.selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');  // Highlight selected legend item
  
        // Filter and render projects based on selected index
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2'); // Render all projects if no wedge is selected
        } else {
          const selectedYear = pieData[selectedIndex]?.label; // Get the year of the selected wedge
          if (selectedYear) {
            const filteredProjects = projects.filter(project => project.year === selectedYear);
            renderProjects(filteredProjects, projectsContainer, 'h2'); // Render projects from the selected year
          } else {
            console.error('Selected year not found in pieData');
          }
        }
      });
  
    // Create the legend for the pie chart
    arcData.forEach((d, idx) => {
      legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // Assign color as a CSS variable
            .html(`<span class="swatch"></span> ${pieData[idx].label} <em>(${pieData[idx].value})</em>`);
    });
  }  