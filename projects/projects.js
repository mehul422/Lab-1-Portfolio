import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('https://mehul422.github.io/Lab-1-Portfolio/lib/projects.json');

console.log("Total projects loaded:", projects.length); // Debugging output

// Select the projects-title element
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

// Select the container to render projects into
const projectsContainer = document.querySelector('.projects');

// Render all the projects (no filtering)
renderProjects(projects, projectsContainer, 'h2');



