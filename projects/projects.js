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

let arc = d3.arc().innerRadius(0).outerRadius(50)({
    startAngle: 0,
    endAngle: 2 * Math.PI,
  });
  
d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');


