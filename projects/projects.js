import { fetchJSON, renderProjects } from '../global.js';

// Fetch the project data
const projects = await fetchJSON('https://mehul422.github.io/Lab-1-Portfolio/lib/projects.json');

// Select the projects-title element
const projectsTitle = document.querySelector('.projects-title');

// Calculate the number of projects and update the text of the h1 tag
const projectCount = projects.length;
projectsTitle.textContent = `${projectCount} Projects`;

// Select the container to render projects into
const projectsContainer = document.querySelector('.projects');

// Render all the projects (no filtering)
renderProjects(projects, projectsContainer, 'h2');


