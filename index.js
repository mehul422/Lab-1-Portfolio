import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

try {
  const projects = await fetchJSON('./lib/projects.json');

  // Check if projects data is fetched correctly and is an array
  if (projects && Array.isArray(projects) && projects.length > 0) {
    const latestProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector('.projects');
    renderProjects(latestProjects, projectsContainer, 'h2');
  } else {
    console.warn('No projects data found or failed to fetch.');
  }

  const githubData = await fetchGitHubData('mehul422');

  // Check if GitHub data is available before updating the profile stats
  const profileStats = document.querySelector('#profile-stats');
  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt><dd>${githubData.followers}</dd>
        <dt>Following:</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  } else {
    console.warn('GitHub data not fetched or not available.');
  }
} catch (error) {
  console.error('Error fetching data:', error);
}