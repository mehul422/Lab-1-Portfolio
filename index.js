import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';  // Import functions

// Fetch project data
const projects = await fetchJSON('https://mehul422.github.io/Lab-1-Portfolio/projects/lib/projects.json');

// Filter the first 3 projects
const latestProjects = projects.slice(0, 3);

// Select the container where the projects will be displayed
const projectsContainer = document.querySelector('.projects');

// Render the filtered projects
renderProjects(latestProjects, projectsContainer, 'h2');

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