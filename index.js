import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';  // Import functions

// Fetch project data
const projects = await fetchJSON('https://mehul422.github.io/Lab-1-Portfolio/lib/projects.json');

// Determine which page we're on
const isHomePage = document.body.classList.contains('home');
const isProjectsPage = document.body.classList.contains('projects');

// Select the container where the projects will be displayed
const projectsContainer = document.querySelector('.projects');

// Render the appropriate number of projects based on the page
if (isHomePage) {
  // On the home page, render only the first 3 projects
  const latestProjects = projects.slice(0, 3);
  renderProjects(latestProjects, projectsContainer, 'h2');
} else if (isProjectsPage) {
  // On the projects page, render all projects
  renderProjects(projects, projectsContainer, 'h2');
}

const githubData = await fetchGitHubData('mehul422');

const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
}