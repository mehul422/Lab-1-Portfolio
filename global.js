console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define the pages array with links
let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'contact/index.html', title: 'Contact' },
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
