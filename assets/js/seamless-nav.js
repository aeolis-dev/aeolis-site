class SeamlessNav {
  constructor() {
    this.cache = new Map();
    this.isNavigating = false;
    this.preloadedPages = new Set();
    this.isCloudflarePages = this.detectCloudflarePages();
    
    this.init();
  }

  detectCloudflarePages() {
    // Detect if we're running on Cloudflare Pages
    // Cloudflare Pages typically serves pages without .html extensions
    return window.location.hostname.includes('pages.dev') || 
           window.location.hostname.includes('aeolis.dev') ||
           window.location.hostname.includes('cloudflare.com');
  }

  normalizeUrl(url) {
    // Remove .html extension for Cloudflare Pages compatibility
    if (this.isCloudflarePages && url.endsWith('.html')) {
      return url.replace(/\.html$/, '');
    }
    return url;
  }

  getFetchUrl(url) {
    // For fetching content, we need to ensure we have the .html extension
    // since the actual files have .html extensions
    if (!url.endsWith('.html') && !url.endsWith('/') && url !== '') {
      return url + '.html';
    }
    return url;
  }

  getDisplayUrl(url) {
    // For display in browser history, use clean URLs without .html
    return this.normalizeUrl(url);
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
    this.handleDirectNavigation();
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
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
      return false;
    }
    
    // Handle root path
    if (href === '/' || href === '') {
      return true;
    }
    
    // Handle .html extensions
    if (href.endsWith('.html')) {
      return true;
    }
    
    // Handle clean URLs (without extensions)
    const validPages = ['index', 'contact', 'attackvector', 'reptify', 'megaherb'];
    const pageName = href.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    return validPages.includes(pageName);
  }

  async preloadPage(url) {
    const fetchUrl = this.getFetchUrl(url);
    if (this.preloadedPages.has(fetchUrl)) return;
    
    try {
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const html = await response.text();
        this.cache.set(fetchUrl, html);
        this.preloadedPages.add(fetchUrl);
        console.log(`Preloaded: ${fetchUrl}`);
      }
    } catch (error) {
      console.warn(`Failed to preload ${fetchUrl}:`, error);
    }
  }

  async navigateTo(url) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      const fetchUrl = this.getFetchUrl(url);
      const displayUrl = this.getDisplayUrl(url);
      
      // Get page content (from cache or fetch)
      let html = this.cache.get(fetchUrl);
      
      if (!html) {
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Failed to load ${fetchUrl}`);
        html = await response.text();
        this.cache.set(fetchUrl, html);
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
      await this.swapContent(newContent, newFloatingTitle, newTitle, displayUrl);

      // Update browser history with clean URL
      history.pushState({ url: displayUrl }, '', displayUrl);

    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback to normal navigation
      window.location.href = this.getDisplayUrl(url);
    } finally {
      this.isNavigating = false;
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
  }

  handleBrowserNavigation() {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.url) {
        this.navigateTo(e.state.url);
      } else {
        // Handle direct navigation (no state)
        const currentPath = window.location.pathname;
        const normalizedPath = this.normalizeUrl(currentPath);
        this.navigateTo(normalizedPath);
      }
    });
  }

  handleDirectNavigation() {
    // Handle direct navigation to URLs with .html extensions
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('.html') && this.isCloudflarePages) {
      // Redirect to clean URL
      const cleanUrl = this.normalizeUrl(currentPath);
      history.replaceState({ url: cleanUrl }, '', cleanUrl);
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      return this.isCloudflarePages ? 'index' : 'index.html';
    }
    const page = path.split('/').pop();
    return this.normalizeUrl(page);
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
`;
document.head.appendChild(style);

// Initialize seamless navigation
window.seamlessNav = new SeamlessNav(); 