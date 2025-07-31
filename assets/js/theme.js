const themeConfig = {
    'Default': { dark: 'default', light: 'aether' },
    'Eclipse': { dark: 'eclipse', light: 'sunrise' },
    'Inferno': { dark: 'inferno', light: 'desert' },
    'Monolith': { dark: 'monolith', light: 'lavender' },
    'Future': { dark: 'future', light: 'pastel' },
    'Tropical': { dark: 'tropical', light: 'sky' },
    'Sugar': { dark: 'sugar', light: 'sakura' }
};

document.addEventListener('DOMContentLoaded', () => {
    const head = document.head;
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;
    const docEl = document.documentElement;

    /* --------------------------------------------------
       1.  Dynamically preload all theme stylesheets
    -------------------------------------------------- */
    for (const themeName in themeConfig) {
        const theme = themeConfig[themeName];
        ['dark', 'light'].forEach(mode => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `assets/css/themes/theme-${theme[mode]}.css`;
            head.appendChild(link);
        });
    }

    /* --------------------------------------------------
       2.  State helpers
    -------------------------------------------------- */
    let currentThemeName = localStorage.getItem('selectedTheme') || 'Default';
    let currentMode      = localStorage.getItem('themeMode')     || 'dark';

    const themeSquares = []; // will hold references for later highlighting

    // Utility function to ensure theme transitions work properly
    const ensureTransitions = () => {
        // Force remove no-transitions class
        docEl.classList.remove('no-transitions');
        
        // Ensure body has explicit transition properties
        body.style.transition = 'background-color 0.8s ease, color 0.8s ease';
        
        // Force reflow to ensure transitions are applied
        body.offsetHeight;
    };

    /* --------------------------------------------------
       3. Theme apply / preview helpers
    -------------------------------------------------- */
    const removeThemeClasses = () => {
        body.className = body.className.replace(/theme-\S+/g, '').trim();
        docEl.className = docEl.className.replace(/theme-\S+/g, '').trim();
    };

    const updateSquareVisualMode = () => {
        const border   = currentMode === 'dark' ? '#000' : '#fff';
        const glow     = currentMode === 'dark' ? '#fff' : '#000';
        document.documentElement.style.setProperty('--square-border', border);
        document.documentElement.style.setProperty('--square-glow',   glow);
    };

    const highlightSelectedSquare = (themeName) => {
        themeSquares.forEach(sq => {
            sq.classList.toggle('selected', sq.dataset.theme === themeName);
        });
    };

    function applyTheme(themeName, mode) {
        const theme = themeConfig[themeName];
        if (!theme) return;

        // Ensure transitions work properly
        ensureTransitions();
        
        // Small delay to ensure transitions are ready
        setTimeout(() => {
            removeThemeClasses();
            const className = `theme-${theme[mode]}`;
            body.classList.add(className);
            docEl.classList.add(className);

            // Persist state
            currentThemeName = themeName;
            currentMode      = mode;
            localStorage.setItem('selectedTheme', themeName);
            localStorage.setItem('themeMode', mode);
            localStorage.setItem('appliedThemeClass', theme[mode]);

            // Update header toggle text & glitch dataset
            if (themeToggleButton) {
                themeToggleButton.textContent = mode === 'dark' ? 'LIGHT >>' : 'DARK >>';
                themeToggleButton.dataset.text = themeToggleButton.textContent;
                themeToggleButton.classList.add('local-glitch-text');
                
                // Ensure the button is properly styled after navigation
                themeToggleButton.style.color = 'var(--text-primary)';
                themeToggleButton.style.transition = 'color 0.8s ease';
            }

            updateSquareVisualMode();
            highlightSelectedSquare(themeName);
            updateSquareBackgrounds();
        }, 10);
    }

    const previewTheme = (themeName) => {
        const theme = themeConfig[themeName];
        if (!theme) return;
        // Ensure transitions work for preview
        ensureTransitions();
        removeThemeClasses();
        body.classList.add(`theme-${theme[currentMode]}`);
        docEl.classList.add(`theme-${theme[currentMode]}`);
    };

    /* --------------------------------------------------
       4. Build vertical selector UI
    -------------------------------------------------- */
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'theme-selector-container';
    document.body.appendChild(selectorContainer);

    const getAccentColor = (variant) => {
        // Create a hidden element to retrieve CSS variable from that variant
        const tmp = document.createElement('div');
        tmp.style.display = 'none';
        tmp.className = `theme-${variant}`;
        document.body.appendChild(tmp);
        const color = getComputedStyle(tmp).getPropertyValue('--accent-primary').trim() || '#000';
        tmp.remove();
        return color;
    };

    const hexToRgba = (hex, alpha = 1) => {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const updateSquareBackgrounds = () => {
        themeSquares.forEach(square => {
            const name = square.dataset.theme;
            const darkVariant  = themeConfig[name].dark;
            const lightVariant = themeConfig[name].light;

            // Helper to extract colours from a temporary element
            const extractColours = (variant) => {
                const tmp = document.createElement('div');
                tmp.className = `theme-${variant}`;
                tmp.style.display = 'none';
                document.body.appendChild(tmp);
                const accent = getComputedStyle(tmp).getPropertyValue('--accent-primary').trim();
                const bg     = getComputedStyle(tmp).getPropertyValue('--bg-primary').trim();
                tmp.remove();
                return { accent, bg };
            };

            const darkC  = extractColours(darkVariant);
            const lightC = extractColours(lightVariant);

            const darkAccentRGBA  = hexToRgba(darkC.accent || '#000', 0.8);
            const lightAccentRGBA = hexToRgba(lightC.accent || '#fff', 0.8);

            // Orientation depends on currentMode
            const tlAccent = currentMode === 'dark' ? darkAccentRGBA  : lightAccentRGBA;
            const tlBg     = currentMode === 'dark' ? darkC.bg        : lightC.bg;
            const brAccent = currentMode === 'dark' ? lightAccentRGBA : darkAccentRGBA;
            const brBg     = currentMode === 'dark' ? lightC.bg       : darkC.bg;

            const topLeftGradient  = `linear-gradient(135deg, ${tlAccent} 0%, ${tlBg} 100%)`;
            const botRightGradient = `linear-gradient(315deg, ${brAccent} 0%, ${brBg} 100%)`;

            square.style.backgroundImage    = `${topLeftGradient}, ${botRightGradient}`;
            square.style.backgroundSize     = '100% 100%';
            square.style.backgroundPosition = 'top left, bottom right';
            square.style.backgroundRepeat   = 'no-repeat';
        });
    };

    for (const themeName in themeConfig) {
        const square = document.createElement('div');
        square.className = 'theme-square';
        square.dataset.theme = themeName;

        // Background split based on dark/light accent colours
        const darkVariant  = themeConfig[themeName].dark;
        const lightVariant = themeConfig[themeName].light;
        const darkColor  = getAccentColor(darkVariant);
        const lightColor = getAccentColor(lightVariant);
        square.style.background = `linear-gradient(135deg, ${darkColor} 0%, ${darkColor} 50%, ${lightColor} 50%, ${lightColor} 100%)`;

        // Hover preview
        square.addEventListener('mouseenter', () => previewTheme(themeName));
        square.addEventListener('mouseleave', () => {
            ensureTransitions();
            applyTheme(currentThemeName, currentMode);
        });
        // Click to set
        square.addEventListener('click', () => applyTheme(themeName, currentMode));

        selectorContainer.appendChild(square);
        themeSquares.push(square);
    }

    /* --------------------------------------------------
       5. Header toggle dark/light interaction
    -------------------------------------------------- */
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const newMode = currentMode === 'dark' ? 'light' : 'dark';
            applyTheme(currentThemeName, newMode);
        });

        // Hover preview with slow transition
        themeToggleButton.addEventListener('mouseenter', () => {
            const previewMode = currentMode === 'dark' ? 'light' : 'dark';
            const oldMode = currentMode;
            const theme = themeConfig[currentThemeName];
            // Ensure transitions work for preview
            ensureTransitions();
            removeThemeClasses();
            const previewClass = `theme-${theme[previewMode]}`;
            body.classList.add(previewClass);
            docEl.classList.add(previewClass);
            currentMode = previewMode;
            updateSquareBackgrounds();
            currentMode = oldMode;
        });

        themeToggleButton.addEventListener('mouseleave', () => {
            ensureTransitions();
            applyTheme(currentThemeName, currentMode);
            updateSquareBackgrounds();
        });
    }

    /* --------------------------------------------------
       6. Initialisation
    -------------------------------------------------- */
    applyTheme(currentThemeName, currentMode);

    if (document.readyState === 'complete') {
        updateSquareBackgrounds();
    } else {
        window.addEventListener('load', updateSquareBackgrounds);
    }
    
    /* --------------------------------------------------
       7. Reinitialize function for seamless navigation
    -------------------------------------------------- */
    window.themeSystem = {
        reinitialize: () => {
            // Reapply current theme to ensure proper styling after navigation
            applyTheme(currentThemeName, currentMode);
            updateSquareBackgrounds();
            
            // Reattach event listeners if needed
            const themeToggleButton = document.getElementById('theme-toggle-button');
            if (themeToggleButton && !themeToggleButton.hasAttribute('data-listener-attached')) {
                themeToggleButton.setAttribute('data-listener-attached', 'true');
                
                themeToggleButton.addEventListener('click', () => {
                    const newMode = currentMode === 'dark' ? 'light' : 'dark';
                    applyTheme(currentThemeName, newMode);
                });
            }
        }
    };
}); 