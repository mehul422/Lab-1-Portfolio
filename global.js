console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define the pages array with links
let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'contact/index.html', title: 'Contact' },
  { url: 'meta/index.html', title: 'Meta' },
  { url: 'https://github.com/mehul422', title: 'GitHub' },
  { url: 'cv/resume/index.html', title: 'Resume/CV' }
];


// Create the <nav> element and add it to the body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Check if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Iterate over pages and create links
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Adjust relative URLs by adding /Lab-1-Portfolio if we're not on the home page
  if (!ARE_WE_HOME && !url.startsWith('http') && !url.startsWith('/')) {
    url = '/Lab-1-Portfolio/' + url;
  }

  // Create a new <a> element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Append the link to the nav
  nav.append(a);

  // Add the 'current' class if this is the active page
  a.classList.toggle(
    'current',
    a.href === location.href || (a.pathname === location.pathname && a.host === location.host)
  );

  // Add a line break after each link (optional)
  nav.append(document.createElement('br'));

  // Set target="_blank" for external links (e.g., GitHub)
  if (a.host !== location.host) {
    a.target = '_blank';
  }
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select id="theme-switch">
        <option value="auto" ${window.matchMedia("(prefers-color-scheme: dark)").matches ? 'selected' : ''}>Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
);

const themeSwitch = document.querySelector('#theme-switch'); // Get the select element

// Initial theme setup based on localStorage or system preference
window.addEventListener('DOMContentLoaded', () => {
  const savedScheme = localStorage.colorScheme;

  if (savedScheme) {
    document.documentElement.style.colorScheme = savedScheme;
    themeSwitch.value = savedScheme;
  } else {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
    document.documentElement.style.colorScheme = 'light dark';
    themeSwitch.value = systemTheme; // Set default dropdown to match system preference
  }
});

// Listen for theme change via dropdown
themeSwitch.addEventListener('input', (event) => {
  const selected = event.target.value;
  localStorage.colorScheme = selected; // Save to localStorage

  if (selected === 'auto') {
    document.documentElement.style.colorScheme = 'light dark'; // Follow system theme
  } else {
    document.documentElement.style.colorScheme = selected;
    if (selected === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return [];
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Clear any existing content
  containerElement.innerHTML = '';

  if (!projects || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects found.</p>';
    return;
  }

  // Iterate over each project and render its details
  projects.forEach(project => {
    const article = document.createElement('article');

    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div class="project-info">
        <p>${project.description}</p>
        <span class="project-year">c. ${project.year}</span>
      </div>
    `;

    // Append the article to the container
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}


  
