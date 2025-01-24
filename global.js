console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select id="color-scheme-selector">
        <option value="auto">Automatic (OS Default)</option>
        <option value="light">Light Mode</option>
        <option value="dark">Dark Mode</option>
      </select>
    </label>`
);

// Get the <select> element for theme switching
const select = document.querySelector('#color-scheme-selector');

// Get the saved theme from localStorage (or default to 'auto')
const savedTheme = localStorage.getItem('colorScheme') || 'auto';
select.value = savedTheme; // Set the dropdown to the saved value

// Function to apply the selected theme
function setColorScheme(scheme) {
  if (scheme === 'auto') {
    // Revert to the OS's default theme (light or dark)
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('color-scheme', 'light dark');
  } else {
    // Apply the selected theme (light or dark)
    document.documentElement.setAttribute('data-theme', scheme);
    document.documentElement.setAttribute('color-scheme', scheme);
  }
}

// Apply the saved theme on page load
setColorScheme(savedTheme);

// Add event listener to handle theme change
select.addEventListener('input', function (event) {
  const selectedScheme = event.target.value;
  console.log('Color scheme changed to', selectedScheme);
  setColorScheme(selectedScheme);  // Apply the selected theme
  localStorage.setItem('colorScheme', selectedScheme); // Save the selected theme to localStorage
});

// Define the pages array with links
let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'contact/index.html', title: 'Contact' },
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
    a.host === location.host && a.pathname === location.pathname
  );

  // Add a line break after each link (optional)
  nav.append(document.createElement('br'));

  // Set target="_blank" for external links (e.g., GitHub)
  if (a.host !== location.host) {
    a.target = '_blank';
  }
}
