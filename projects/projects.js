import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('https://mehul422.github.io/Lab-1-Portfolio/lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');