console.log('IT’S ALIVE!');

// Insert the theme switcher dropdown into the body
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

// Retrieve the saved theme from localStorage (default to 'auto' if not found)
const savedTheme = localStorage.getItem('colorScheme') || 'auto';
select.value = savedTheme;  // Set the dropdown to match the saved theme

// Function to apply the selected theme
function setColorScheme(scheme) {
  console.log(`Setting theme to ${scheme}`);  // Debugging line to check when the theme is set

  if (scheme === 'auto') {
    // Revert to the OS's default theme (light or dark)
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('color-scheme', 'light dark'); // Allow OS to choose
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
  console.log('Color scheme changed to', selectedScheme);  // Debugging line to check if the event is triggered
  setColorScheme(selectedScheme);  // Apply the selected theme
  localStorage.setItem('colorScheme', selectedScheme); // Save the selected theme to localStorage
});
