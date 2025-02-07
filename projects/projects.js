import { fetchJSON, renderProjects } from '../global.js';

// Fetch the project data with cache busting
const projects = await fetchJSON(`https://mehul422.github.io/Lab-1-Portfolio/lib/projects.json?nocache=${Date.now()}`);

console.log("Total projects loaded:", projects.length); // Debugging output

// Ensure projects are fully loaded before updating UI
if (projects.length === 0) {
    console.error("No projects loaded. Retrying...");
} else {
    // Select the projects-title element
    const projectsTitle = document.querySelector('.projects-title');
    projectsTitle.textContent = `${projects.length} Projects`;

    // Select the container to render projects into
    const projectsContainer = document.querySelector('.projects');

    // Render all the projects (no filtering)
    renderProjects(projects, projectsContainer, 'h2');
}



