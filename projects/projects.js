import { fetchJSON, renderProjects } from '../global.js';

// Fetch the project data
const projects = await fetchJSON('/lib/projects.json');

// Get the container where projects will be displayed
const projectsContainer = document.querySelector('.projects');

// Render all projects to the container
projects.forEach(project => renderProjects(project, projectsContainer, 'h2'));

// Get the project count element and set its text content
const projectCountElement = document.getElementById('project-count');
projectCountElement.textContent = projects.length; // Set the count to the number of projects
