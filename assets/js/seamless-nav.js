class SeamlessNav {
  constructor() {
    this.cache = new Map();
    this.isNavigating = false;
    this.preloadedPages = new Set();
    this.activeVideoPlayers = new Map(); // Track active video players
    
    this.init();
  }

  init() {
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.interceptLinks();
    this.setupHoverPreloading();
    this.handleBrowserNavigation();
    this.normalizeCurrentURL(); // Normalize URL on page load
    
    // Ensure proper initialization on direct page load
    this.initializeCurrentPage();
  }

  normalizeCurrentURL() {
    // Remove .html extension from current URL if it's the index page
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('/index.html') || currentPath.endsWith('/index')) {
      const newPath = currentPath.replace(/\/index\.html?$/, '/');
      if (newPath !== currentPath) {
        history.replaceState({ url: newPath }, '', newPath);
      }
    }
  }

  interceptLinks() {
    // Intercept all internal navigation links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      
      // Only handle internal HTML pages
      if (this.isInternalPage(href)) {
        e.preventDefault();
        this.navigateTo(href);
      }
    });
  }

  setupHoverPreloading() {
    // Preload pages on link hover
    document.addEventListener('mouseenter', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      
      if (this.isInternalPage(href)) {
        this.preloadPage(href);
      }
    }, true); // Use capture to catch early
  }

  isInternalPage(href) {
    // Check if it's an internal HTML page
    return href && 
           !href.startsWith('http') && 
           !href.startsWith('mailto:') && 
           !href.startsWith('#') &&
           (href.endsWith('.html') || href === '/' || !href.includes('.'));
  }

  normalizeURL(url) {
    // Normalize URLs to remove .html extension for index page
    if (url.endsWith('/index.html') || url.endsWith('/index')) {
      return url.replace(/\/index\.html?$/, '/');
    }
    return url;
  }

  async preloadPage(url) {
    const normalizedUrl = this.normalizeURL(url);
    if (this.preloadedPages.has(normalizedUrl)) return;
    
    try {
      const response = await fetch(normalizedUrl);
      if (response.ok) {
        const html = await response.text();
        this.cache.set(normalizedUrl, html);
        this.preloadedPages.add(normalizedUrl);
        console.log(`Preloaded: ${normalizedUrl}`);
      }
    } catch (error) {
      console.warn(`Failed to preload ${normalizedUrl}:`, error);
    }
  }

  async navigateTo(url) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      const normalizedUrl = this.normalizeURL(url);
      console.log(`Navigating to: ${url} (normalized: ${normalizedUrl})`);
      
      // Clean up any active video players before navigation
      this.cleanupActiveVideos();
      
      // Get page content (from cache or fetch)
      let html = this.cache.get(normalizedUrl);
      
      if (!html) {
        const response = await fetch(normalizedUrl);
        if (!response.ok) throw new Error(`Failed to load ${normalizedUrl}`);
        html = await response.text();
        this.cache.set(normalizedUrl, html);
      }

      // Parse the new page
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');

      // Extract key elements
      const newContent = newDoc.querySelector('.content');
      const newFloatingTitle = newDoc.querySelector('.floating-title');
      const newTitle = newDoc.querySelector('title');

      if (!newContent) throw new Error('Invalid page structure');

      // Update page content with smooth transition
      await this.swapContent(newContent, newFloatingTitle, newTitle, normalizedUrl);

      // Update browser history with normalized URL
      history.pushState({ url: normalizedUrl }, '', normalizedUrl);
      
      console.log(`Navigation completed successfully to: ${normalizedUrl}`);

    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback to normal navigation
      window.location.href = url;
    } finally {
      this.isNavigating = false;
    }
  }

  cleanupActiveVideos() {
    // Stop and destroy all active video players
    this.activeVideoPlayers.forEach((player, key) => {
      if (player && typeof player.destroy === 'function') {
        console.log(`Cleaning up video player: ${key}`);
        player.destroy();
      }
    });
    this.activeVideoPlayers.clear();
    
    // Also clean up any global video players
    if (window.reptifyVideoPlayer && typeof window.reptifyVideoPlayer.destroy === 'function') {
      window.reptifyVideoPlayer.destroy();
      window.reptifyVideoPlayer = null;
    }
    if (window.attackVectorVideoPlayer && typeof window.attackVectorVideoPlayer.destroy === 'function') {
      window.attackVectorVideoPlayer.destroy();
      window.attackVectorVideoPlayer = null;
    }
    if (window.megaherbVideoPlayer && typeof window.megaherbVideoPlayer.destroy === 'function') {
      window.megaherbVideoPlayer.destroy();
      window.megaherbVideoPlayer = null;
    }
  }

  async swapContent(newContent, newFloatingTitle, newTitle, url) {
    const currentContent = document.querySelector('.content');
    const currentFloatingTitle = document.querySelector('.floating-title');
    const visualArea = document.querySelector('.visual-area');
    const dynamicVisual = document.getElementById('dynamic-visual');
    
    // Preserve theme classes during navigation
    const docEl = document.documentElement;
    const body = document.body;
    const currentThemeClasses = Array.from(docEl.classList).filter(cls => cls.startsWith('theme-'));
    const currentBodyThemeClasses = Array.from(body.classList).filter(cls => cls.startsWith('theme-'));
    
    // Start fade out - both content and visual area
    document.body.classList.add('navigating');
    currentContent.style.opacity = '0';
    currentContent.style.transform = 'translateY(20px)';
    
    // Fade out visual area content smoothly
    if (dynamicVisual) {
      dynamicVisual.style.opacity = '0';
      dynamicVisual.style.transition = 'opacity 150ms ease';
    }

    // Wait for fade out
    await this.wait(200);

    // Update content
    currentContent.innerHTML = newContent.innerHTML;
    
    // Update floating title text
    if (newFloatingTitle && currentFloatingTitle) {
      currentFloatingTitle.textContent = newFloatingTitle.textContent;
    }

    // Update page title
    if (newTitle) {
      document.title = newTitle.textContent;
    }

    // Update body class for page-specific styling
    body.className = '';
    if (url.includes('reptify')) {
      body.classList.add('reptify-page');
    } else if (url.includes('attackvector')) {
      body.classList.add('attackvector-page');
    } else if (url.includes('megaherb')) {
      body.classList.add('megaherb-page');
    } else if (url.includes('contact')) {
      body.classList.add('contact-page');
    } else {
      body.classList.add('index-page');
    }

    // Restore theme classes if they were lost
    currentThemeClasses.forEach(cls => {
      if (!docEl.classList.contains(cls)) {
        docEl.classList.add(cls);
      }
    });
    
    currentBodyThemeClasses.forEach(cls => {
      if (!body.classList.contains(cls)) {
        body.classList.add(cls);
      }
    });

    // Force CSS reapplication by triggering a reflow
    this.forceCSSReflow();

    // Update visual area for new page and set appropriate size
    this.updateVisualAreaForPage(url);

    // Restart any page-specific JavaScript
    this.reinitializePageScripts();

    // Fade back in - content first, then visual area
    currentContent.style.opacity = '1';
    currentContent.style.transform = 'translateY(0)';
    
    // Short delay before fading visual area back in
    await this.wait(100);
    
    // Fade visual area back in
    if (dynamicVisual) {
      dynamicVisual.style.opacity = '1';
      // Remove transition after fade-in completes
      setTimeout(() => {
        dynamicVisual.style.transition = '';
      }, 200);
    }
    
    await this.wait(50);
    document.body.classList.remove('navigating');
  }

  forceCSSReflow() {
    // Force browser to recalculate styles by triggering a reflow
    const body = document.body;
    const forceReflow = body.offsetHeight;
    // Trigger a small style change to force CSS recalculation
    body.style.transform = 'translateZ(0)';
    setTimeout(() => {
      body.style.transform = '';
    }, 10);
  }

  updateVisualAreaForPage(url) {
    const dynamicVisual = document.getElementById('dynamic-visual');
    const visualArea = document.querySelector('.visual-area');
    if (!dynamicVisual || !visualArea) return;

    // Remove all project classes
    dynamicVisual.classList.remove('attackvector', 'reptify', 'megaherb', 'aeolis', 'contact');
    
    // Set appropriate class and fixed size based on page
    if (url.includes('attackvector')) {
      dynamicVisual.classList.add('attackvector');
      // Fixed video size for AttackVector page
      visualArea.style.height = '338px'; // 16:9 aspect ratio for 600px width
      // Initialize video player after navigation
      setTimeout(() => {
        if (window.initializeAttackVectorVideo) {
          window.initializeAttackVectorVideo();
        }
      }, 300); // Delay to allow fade-in to complete
    } else if (url.includes('reptify')) {
      dynamicVisual.classList.add('reptify');
      // Fixed content size for Reptify - will be updated by video initialization
      visualArea.style.height = '400px';
      // Initialize video player after navigation
      setTimeout(() => {
        if (window.initializeReptifyVideo) {
          window.initializeReptifyVideo();
        }
      }, 300); // Delay to allow fade-in to complete
    } else if (url.includes('megaherb')) {
      dynamicVisual.classList.add('megaherb');
      // Fixed content size for Megaherb
      visualArea.style.height = '400px';
    } else if (url.includes('contact')) {
      dynamicVisual.classList.add('contact');
      // Fixed content size for Contact
      visualArea.style.height = '400px';
    } else {
      // Default state for index - remove fixed height to allow dynamic resizing
      dynamicVisual.setAttribute('data-state', 'default');
      visualArea.style.height = '';
    }
  }

  reinitializePageScripts() {
    // Reinitialize any page-specific functionality
    if (window.main && window.main.reinitialize) {
      window.main.reinitialize();
    }
    
    // Reinitialize video player if needed
    if (window.initializeVideoPlayer) {
      window.initializeVideoPlayer();
    }
    
    // Reinitialize Reptify video if on reptify page
    if (window.location.pathname.includes('reptify') && window.initializeReptifyVideo) {
      window.initializeReptifyVideo();
    }
    
    // Ensure theme transitions work after navigation
    // Remove no-transitions class if it exists
    const docEl = document.documentElement;
    if (docEl.classList.contains('no-transitions')) {
      setTimeout(() => {
        docEl.classList.remove('no-transitions');
      }, 100);
    }
    
    // Reinitialize theme system if needed
    if (window.themeSystem && window.themeSystem.reinitialize) {
      window.themeSystem.reinitialize();
    }
    
    // Force a small delay to ensure all scripts are properly initialized
    setTimeout(() => {
      // Trigger any pending style recalculations
      this.forceCSSReflow();
    }, 50);
  }

  handleBrowserNavigation() {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.url) {
        this.navigateTo(e.state.url);
      } else {
        // Handle direct URL access (back/forward buttons)
        const currentPath = window.location.pathname;
        this.navigateTo(currentPath);
      }
    });
    
    // Also handle beforeunload to clean up videos when leaving the page
    window.addEventListener('beforeunload', () => {
      this.cleanupActiveVideos();
    });
  }

  initializeCurrentPage() {
    // Set proper body class for current page
    const body = document.body;
    const currentPath = window.location.pathname;
    
    body.className = '';
    if (currentPath.includes('reptify')) {
      body.classList.add('reptify-page');
    } else if (currentPath.includes('attackvector')) {
      body.classList.add('attackvector-page');
    } else if (currentPath.includes('megaherb')) {
      body.classList.add('megaherb-page');
    } else if (currentPath.includes('contact')) {
      body.classList.add('contact-page');
    } else {
      body.classList.add('index-page');
    }
    
    // Force CSS reflow to ensure proper styling
    this.forceCSSReflow();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    return path === '/' ? 'index.html' : path.split('/').pop();
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Add CSS for navigation transitions
const style = document.createElement('style');
style.textContent = `
  .content {
    transition: opacity 0.2s ease, transform 0.2s ease !important;
  }
  
  body.navigating .content {
    transition: opacity 0.2s ease, transform 0.2s ease !important;
  }
  
  /* Visual area smooth transitions during navigation */
  .dynamic-visual {
    transition: opacity 0.15s ease;
  }
  
  body.navigating .dynamic-visual {
    transition: opacity 0.15s ease;
  }
  
  /* Ensure theme transitions are preserved during navigation */
  body.navigating *,
  body.navigating *::before,
  body.navigating *::after {
    transition-property: background-color, color, border-color, background, opacity, transform !important;
    transition-duration: var(--transition-mid, 1.4s) !important;
    transition-timing-function: ease !important;
  }
  
  body.navigating {
    transition-duration: var(--transition-bg, 0.8s) !important;
  }
  
  /* Ensure proper scrollbar styling after navigation */
  body:not(.index-page) .project,
  body.reptify-page .project,
  body.attackvector-page .project,
  body.megaherb-page .project,
  body.contact-page .project {
    overflow-y: auto !important;
    scrollbar-width: thin !important;
    scrollbar-color: var(--border-primary) transparent !important;
  }
  
  body:not(.index-page) .project::-webkit-scrollbar,
  body.reptify-page .project::-webkit-scrollbar,
  body.attackvector-page .project::-webkit-scrollbar,
  body.megaherb-page .project::-webkit-scrollbar,
  body.contact-page .project::-webkit-scrollbar {
    width: 6px !important;
  }
  
  body:not(.index-page) .project::-webkit-scrollbar-track,
  body.reptify-page .project::-webkit-scrollbar-track,
  body.attackvector-page .project::-webkit-scrollbar-track,
  body.megaherb-page .project::-webkit-scrollbar-track,
  body.contact-page .project::-webkit-scrollbar-track {
    background: transparent !important;
  }
  
  body:not(.index-page) .project::-webkit-scrollbar-thumb,
  body.reptify-page .project::-webkit-scrollbar-thumb,
  body.attackvector-page .project::-webkit-scrollbar-thumb,
  body.megaherb-page .project::-webkit-scrollbar-thumb,
  body.contact-page .project::-webkit-scrollbar-thumb {
    background: var(--border-primary) !important;
    border-radius: 3px !important;
  }
  
  body:not(.index-page) .project::-webkit-scrollbar-thumb:hover,
  body.reptify-page .project::-webkit-scrollbar-thumb:hover,
  body.attackvector-page .project::-webkit-scrollbar-thumb:hover,
  body.megaherb-page .project::-webkit-scrollbar-thumb:hover,
  body.contact-page .project::-webkit-scrollbar-thumb:hover {
    background: var(--accent-primary) !important;
  }
  
  /* Ensure text visibility after navigation */
  body:not(.index-page) .project-description.local-glitch-text,
  body.reptify-page .project-description.local-glitch-text,
  body.attackvector-page .project-description.local-glitch-text,
  body.megaherb-page .project-description.local-glitch-text,
  body.contact-page .project-description.local-glitch-text {
    color: var(--text-primary) !important;
    transition: none !important;
  }
  
  body:not(.index-page) .project-description.local-glitch-text:hover,
  body.reptify-page .project-description.local-glitch-text:hover,
  body.attackvector-page .project-description.local-glitch-text:hover,
  body.megaherb-page .project-description.local-glitch-text:hover,
  body.contact-page .project-description.local-glitch-text:hover {
    color: var(--text-primary) !important;
  }
  
  body:not(.index-page) .project-description.local-glitch-text::before,
  body:not(.index-page) .project-description.local-glitch-text::after,
  body.reptify-page .project-description.local-glitch-text::before,
  body.reptify-page .project-description.local-glitch-text::after,
  body.attackvector-page .project-description.local-glitch-text::before,
  body.attackvector-page .project-description.local-glitch-text::after,
  body.megaherb-page .project-description.local-glitch-text::before,
  body.megaherb-page .project-description.local-glitch-text::after,
  body.contact-page .project-description.local-glitch-text::before,
  body.contact-page .project-description.local-glitch-text::after {
    display: none !important;
  }
`;
document.head.appendChild(style);

// Initialize seamless navigation
window.seamlessNav = new SeamlessNav(); 