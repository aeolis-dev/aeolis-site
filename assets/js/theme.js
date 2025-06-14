document.addEventListener('DOMContentLoaded', () => {
    const head = document.head;
    const themeSwitcherButton = document.getElementById('theme-switcher-button');
    const themeDropdown = document.getElementById('theme-dropdown');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;

    // Dynamically create stylesheet links and populate the dropdown menu
    for (const themeName in themeConfig) {
        const theme = themeConfig[themeName];
        
        // Create stylesheet links for both dark and light modes
        const darkLink = document.createElement('link');
        darkLink.rel = 'stylesheet';
        darkLink.href = `assets/css/themes/theme-${theme.dark}.css`;
        head.appendChild(darkLink);

        const lightLink = document.createElement('link');
        lightLink.rel = 'stylesheet';
        lightLink.href = `assets/css/themes/theme-${theme.light}.css`;
        head.appendChild(lightLink);

        // Populate dropdown
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.theme = themeName;
        a.textContent = themeName;
        themeDropdown.appendChild(a);
    }

    let currentThemeName = localStorage.getItem('selectedTheme') || 'Default';
    let currentMode = localStorage.getItem('themeMode') || 'dark';

    function applyTheme(themeName, mode) {
        const theme = themeConfig[themeName];
        if (!theme) return;

        const themeClass = `theme-${theme[mode]}`;
        
        // Remove any existing theme classes from the body
        body.className = body.className.replace(/theme-\S+/g, '');
        // Add the new theme class
        body.classList.add(themeClass);

        // Update state and localStorage
        currentThemeName = themeName;
        currentMode = mode;
        localStorage.setItem('selectedTheme', themeName);
        localStorage.setItem('themeMode', mode);

        // Update button text
        themeToggleButton.textContent = mode === 'dark' ? 'LIGHT >>' : 'DARK >>';
    }

    // Event Listeners

    // Toggle between light and dark mode for the current theme
    themeToggleButton.addEventListener('click', () => {
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        applyTheme(currentThemeName, newMode);
    });

    // Handle theme selection from the dropdown
    themeDropdown.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName === 'A' && target.dataset.theme) {
            event.preventDefault();
            const selectedThemeName = target.dataset.theme;
            applyTheme(selectedThemeName, currentMode);
            themeDropdown.classList.remove('show');
        }
    });

    // Show/hide dropdown menu
    themeSwitcherButton.addEventListener('click', () => {
        themeDropdown.classList.toggle('show');
    });

    // Close dropdown if clicking elsewhere on the page
    window.addEventListener('click', (event) => {
        if (!themeSwitcherButton.contains(event.target) && !themeDropdown.contains(event.target)) {
            themeDropdown.classList.remove('show');
        }
    });

    // Initialization
    // Apply the stored theme when the page loads
    applyTheme(currentThemeName, currentMode);
}); 