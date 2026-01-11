// Initialize project card hover effects and dynamic visual area
let attackVectorVideoPlayer = null;
let reptifyVideoPlayer = null;
let megaherbVideoPlayer = null;
let journalsVideoPlayer = null;

// Helper function to destroy all video players
function destroyAllVideoPlayers() {
  if (attackVectorVideoPlayer && !attackVectorVideoPlayer.isDestroyed) {
    attackVectorVideoPlayer.destroy();
    attackVectorVideoPlayer = null;
  }
  if (reptifyVideoPlayer && !reptifyVideoPlayer.isDestroyed) {
    reptifyVideoPlayer.destroy();
    reptifyVideoPlayer = null;
  }
  if (megaherbVideoPlayer && !megaherbVideoPlayer.isDestroyed) {
    megaherbVideoPlayer.destroy();
    megaherbVideoPlayer = null;
  }
  if (journalsVideoPlayer && !journalsVideoPlayer.isDestroyed) {
    journalsVideoPlayer.destroy();
    journalsVideoPlayer = null;
  }
}

// Helper function to create video container
function createVideoContainer(dynamicVisual) {
  // Clean up any existing containers
  const existingContainer = dynamicVisual.querySelector('.video-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Create new container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';
  videoContainer.style.cssText = `
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 5;
    border-radius: 6px;
  `;
  dynamicVisual.insertBefore(videoContainer, dynamicVisual.firstChild);

  return videoContainer;
}

// Helper function to create media resize handler
function createMediaResizeHandler(visualArea, maxDimensions = { width: 0.9, height: 500 }) {
  return (event) => {
    const { player, isVideo, isImage } = event.detail;

    if (!visualArea) return;

    let mediaWidth, mediaHeight;

    if (isVideo && player.video.videoWidth && player.video.videoHeight) {
      mediaWidth = player.video.videoWidth;
      mediaHeight = player.video.videoHeight;
    } else if (isImage && player.imageElement.naturalWidth && player.imageElement.naturalHeight) {
      mediaWidth = player.imageElement.naturalWidth;
      mediaHeight = player.imageElement.naturalHeight;
    }

    if (mediaWidth && mediaHeight) {
      // Get container dimensions
      const containerWidth = visualArea.parentElement.offsetWidth;
      const containerHeight = visualArea.parentElement.offsetHeight;

      // Media dimensions
      const mediaAspectRatio = mediaWidth / mediaHeight;

      // Calculate max dimensions
      const maxWidth = containerWidth * maxDimensions.width;
      const maxHeight = Math.min(maxDimensions.height, containerHeight * 0.85);

      // Calculate dimensions that fit within the container while maintaining aspect ratio
      let finalWidth, finalHeight;

      // Try fitting by width first
      finalWidth = Math.min(containerWidth, maxWidth);
      finalHeight = finalWidth / mediaAspectRatio;

      // If height exceeds max height, fit by height instead
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight * mediaAspectRatio;
      }

      // Apply the calculated dimensions
      visualArea.style.width = `${finalWidth}px`;
      visualArea.style.height = `${finalHeight}px`;

      console.log(`Resized visual area: ${mediaWidth}x${mediaHeight} -> ${finalWidth}x${finalHeight}`);
    }
  };
}

// Helper function to initialize video/image player
async function initializeMediaPlayer(playerRef, container, mediaItems, options, onResize) {
  const player = new VideoPlayer(container, mediaItems, options);
  await player.init();
  console.log(`Media player initialized for ${mediaItems[0]}`);

  if (player && !player.isDestroyed) {
    player.play();

    // Add resize event listener if provided
    if (onResize) {
      container.addEventListener('mediaResize', onResize);
    }

    console.log('Media playback started');
  }

  return player;
}

// Helper function to initialize page video/image player
async function initializePageMedia(pageName, mediaItems, options, resizeConfig) {
  const dynamicVisual = document.getElementById('dynamic-visual');
  const visualArea = document.querySelector('.visual-area');

  if (!dynamicVisual || !window.VideoPlayer) return;

  try {
    // Set visual state and sizing class
    dynamicVisual.className = `dynamic-visual ${pageName}`;
    visualArea.classList.add(resizeConfig.fitClass);

    // Create video container
    const videoContainer = createVideoContainer(dynamicVisual);

    // Initialize player
    const player = new VideoPlayer(videoContainer, mediaItems, options);
    await player.init();
    player.play();

    // Handle resize based on configuration
    if (resizeConfig.useEventResize) {
      // Event-based resize (for Reptify, MEGAHERB, JOURNALS)
      const resizeHandler = createMediaResizeHandler(
        visualArea,
        { width: resizeConfig.maxWidth, height: resizeConfig.maxHeight }
      );
      videoContainer.addEventListener('mediaResize', resizeHandler);
    } else {
      // Direct resize (for AttackVector)
      const videoElement = player.video;
      const handleVideoResize = () => {
        if (videoElement.videoWidth && videoElement.videoHeight) {
          const containerWidth = visualArea.parentElement.offsetWidth;
          const containerHeight = visualArea.parentElement.offsetHeight;
          const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;

          const maxWidth = containerWidth * resizeConfig.maxWidth;
          const maxHeight = Math.min(resizeConfig.maxHeight, containerHeight * 0.8);

          let finalWidth = Math.min(containerWidth, maxWidth);
          let finalHeight = finalWidth / videoAspectRatio;

          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = finalHeight * videoAspectRatio;
          }

          visualArea.style.width = `${finalWidth}px`;
          visualArea.style.height = `${finalHeight}px`;

          videoElement.removeEventListener('loadedmetadata', handleVideoResize);
        }
      };

      if (videoElement.videoWidth && videoElement.videoHeight) {
        handleVideoResize();
      } else {
        videoElement.addEventListener('loadedmetadata', handleVideoResize);
      }
    }

    console.log(`${pageName} media initialized and playing`);
    return player;
  } catch (error) {
    console.error(`Error initializing ${pageName} media:`, error);
  }
}

// Check if we're on the index page
const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

// Global function to resize visual area based on content (INDEX PAGE ONLY)
function resizeVisualArea(contentType = 'default', videoElement = null) {
  // Only resize on index page
  if (!isIndexPage) return;
  
  const visualArea = document.querySelector('.visual-area');
  if (!visualArea) return;
  
  // Remove all sizing classes
  visualArea.classList.remove('content-fit', 'video-fit', 'image-fit');
  
  switch (contentType) {
    case 'video':
      visualArea.classList.add('video-fit');
      
      if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
        // Get container dimensions - use the visual area container's available space
        const containerWidth = visualArea.parentElement.offsetWidth;
        const containerHeight = visualArea.parentElement.offsetHeight;
        
        // Video dimensions
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        const videoAspectRatio = videoWidth / videoHeight;
        
        // Determine which project is being hovered to set appropriate max dimensions
        const hoveredProject = document.querySelector('.project-link:hover .project');
        let maxWidth, maxHeight;
        
        if (hoveredProject && hoveredProject.getAttribute('data-visual') === 'reptify') {
          // For Reptify, allow larger dimensions to accommodate the tall video
          maxWidth = containerWidth * 0.95; // 95% of container width
          maxHeight = Math.min(600, containerHeight * 0.9); // Max 90% of container height or 600px
        } else {
          // For AttackVector and others, use smaller max dimensions
          maxWidth = containerWidth * 0.9; // 90% of container width
          maxHeight = Math.min(400, containerHeight * 0.8); // Max 80% of container height or 400px
        }
        
        // Calculate dimensions that fit within the container while maintaining aspect ratio
        let finalWidth, finalHeight;
        
        // Try fitting by width first
        finalWidth = Math.min(containerWidth, maxWidth);
        finalHeight = finalWidth / videoAspectRatio;
        
        // If height exceeds max height, fit by height instead
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = finalHeight * videoAspectRatio;
        }
        
        // Apply the calculated dimensions
        visualArea.style.width = `${finalWidth}px`;
        visualArea.style.height = `${finalHeight}px`;
      }
      break;
    case 'image':
      visualArea.classList.add('image-fit');
      // Similar logic can be added for images later
      break;
    case 'content':
      visualArea.classList.add('content-fit');
      break;
    default:
      // Default state - reset to CSS defaults
      visualArea.style.width = '';
      visualArea.style.height = '';
      break;
  }
}

// Set fixed visual area size for sub-pages
function setFixedVisualAreaSize() {
  if (isIndexPage) return; // Don't set fixed size on index
  
  const visualArea = document.querySelector('.visual-area');
  const dynamicVisual = document.getElementById('dynamic-visual');
  if (!visualArea || !dynamicVisual) return;
  
  // Set appropriate fixed size based on page
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('attackvector')) {
    // Video aspect ratio size for AttackVector
    visualArea.style.height = '338px'; // 16:9 aspect ratio for 600px width
    dynamicVisual.classList.add('attackvector');
  } else if (currentPage.includes('reptify')) {
    // Video aspect ratio size for Reptify - will be set by video initialization
    visualArea.style.height = '400px'; // Default, will be updated by video
    dynamicVisual.classList.add('reptify');
  } else if (currentPage.includes('megaherb')) {
    // Standard content size for Megaherb
    visualArea.style.height = '400px';
    dynamicVisual.classList.add('megaherb');
  } else if (currentPage.includes('contact')) {
    // Contact page size
    visualArea.style.height = '400px';
    dynamicVisual.classList.add('contact');
  }
}

document.querySelectorAll('.project').forEach((project, i) => {
  // Apply a staggered entrance animation delay (if defined in CSS).
  project.style.animationDelay = `${0.1 + i * 0.1}s`;
  
  // Only add hover effects on index page
  if (isIndexPage) {
    // Update CSS variables for mouse-aware hover effects on project cards.
    project.addEventListener('mousemove', (e) => {
      const x = e.clientX - project.getBoundingClientRect().left;
      const y = e.clientY - project.getBoundingClientRect().top;
      
      // These variables can be used by CSS for effects like a spotlight or gradient following the mouse.
      project.style.setProperty('--mouse-x', `${x}px`);
      project.style.setProperty('--mouse-y', `${y}px`);
    });

    // Dynamic visual area functionality (INDEX PAGE ONLY)
    const dynamicVisual = document.getElementById('dynamic-visual');
    const visualArea = document.querySelector('.visual-area');
    
    if (dynamicVisual) {
      project.addEventListener('mouseenter', async () => {
        const visualType = project.getAttribute('data-visual');
        // Remove all existing visual classes
        dynamicVisual.className = 'dynamic-visual';
        // Add the specific visual class
        if (visualType) {
          dynamicVisual.classList.add(visualType);
          
          // Resize visual area based on content type
          if (visualType === 'attackvector') {
            resizeVisualArea('content'); // Default resize until video loads
          } else if (visualType === 'reptify') {
            resizeVisualArea('content'); // Default resize until video loads
          } else if (visualType === 'aeolis') {
            resizeVisualArea('image'); // Image content type for aeolis
          } else {
            resizeVisualArea('content');
          }
          
          // Special handling for AttackVector - show video
          if (visualType === 'attackvector' && window.VideoPlayer) {
            try {
              destroyAllVideoPlayers();
              const videoContainer = createVideoContainer(dynamicVisual);

              attackVectorVideoPlayer = await initializeMediaPlayer(
                'attackVectorVideoPlayer',
                videoContainer,
                [
                  'assets/video/Gameplay.Demonstration.mp4',
                  'assets/video/Gameplay.Demonstration2.mp4',
                  'assets/video/Gameplay.Demonstration3.mp4'
                ],
                { fadeDuration: 600, gapDuration: 200, loop: true }
              );

              // AttackVector uses simpler resize approach
              const videoElement = attackVectorVideoPlayer.video;
              const handleVideoResize = () => {
                if (videoElement.videoWidth && videoElement.videoHeight) {
                  resizeVisualArea('video', videoElement);
                  videoElement.removeEventListener('loadedmetadata', handleVideoResize);
                }
              };

              if (videoElement.videoWidth && videoElement.videoHeight) {
                resizeVisualArea('video', videoElement);
              } else {
                videoElement.addEventListener('loadedmetadata', handleVideoResize);
              }
            } catch (error) {
              console.error('Error initializing AttackVector player:', error);
            }
          }
          
          // Special handling for Reptify - show mixed media
          if (visualType === 'reptify' && window.VideoPlayer) {
            try {
              destroyAllVideoPlayers();
              const videoContainer = createVideoContainer(dynamicVisual);
              const visualArea = document.querySelector('.visual-area');

              reptifyVideoPlayer = await initializeMediaPlayer(
                'reptifyVideoPlayer',
                videoContainer,
                [
                  'assets/images/reptify loading screen.png',
                  'assets/images/reptify sign in.png',
                  'assets/images/reptify home.png',
                  'assets/images/reptify settings.png',
                  'assets/images/reptify calculator.png',
                  'assets/images/reptify timer.png',
                  'assets/video/biggener demo.mp4'
                ],
                { fadeDuration: 600, gapDuration: 200, loop: true, imageDuration: 1500 },
                createMediaResizeHandler(visualArea, { width: 0.95, height: 600 }) // Reptify needs larger max height
              );
            } catch (error) {
              console.error('Error initializing Reptify player:', error);
            }
          }
          
          // Special handling for MEGAHERB - show image slideshow
          if (visualType === 'megaherb' && window.VideoPlayer) {
            try {
              destroyAllVideoPlayers();
              const videoContainer = createVideoContainer(dynamicVisual);
              const visualArea = document.querySelector('.visual-area');

              megaherbVideoPlayer = await initializeMediaPlayer(
                'megaherbVideoPlayer',
                videoContainer,
                [
                  'assets/images/beta testing with cat.jpg',
                  'assets/images/building microphone.jpg',
                  'assets/images/form acceptance.png',
                  'assets/images/microphone closeup.jpg'
                ],
                { fadeDuration: 600, gapDuration: 200, loop: true, imageDuration: 2000 },
                createMediaResizeHandler(visualArea, { width: 0.9, height: 500 })
              );
            } catch (error) {
              console.error('Error initializing MEGAHERB video player:', error);
            }
          }
          
          // Special handling for JOURNALS - show image slideshow
          if (visualType === 'journals' && window.VideoPlayer) {
            try {
              destroyAllVideoPlayers();
              const videoContainer = createVideoContainer(dynamicVisual);
              const visualArea = document.querySelector('.visual-area');

              journalsVideoPlayer = await initializeMediaPlayer(
                'journalsVideoPlayer',
                videoContainer,
                [
                  'assets/images/journals.png',
                  'assets/images/vutu to zebra.png'
                ],
                { fadeDuration: 600, gapDuration: 200, loop: true, imageDuration: 2000 },
                createMediaResizeHandler(visualArea, { width: 0.9, height: 500 })
              );
            } catch (error) {
              console.error('Error initializing JOURNALS video player:', error);
            }
          }

          // Special handling for AEOLIS - show single image
          if (visualType === 'aeolis' && window.VideoPlayer) {
            try {
              destroyAllVideoPlayers();
              const videoContainer = createVideoContainer(dynamicVisual);
              const visualArea = document.querySelector('.visual-area');

              // AEOLIS uses single image with no loop
              const aeolisVideoPlayer = await initializeMediaPlayer(
                'aeolisVideoPlayer',
                videoContainer,
                ['assets/images/you are here.png'],
                { fadeDuration: 600, gapDuration: 200, loop: false, imageDuration: 0 },
                createMediaResizeHandler(visualArea, { width: 0.9, height: 500 })
              );
            } catch (error) {
              console.error('Error initializing AEOLIS image player:', error);
            }
          }
        }
      });

      project.addEventListener('mouseleave', () => {
        // Reset to default state
        dynamicVisual.className = 'dynamic-visual';
        resizeVisualArea('default');

        // Destroy all video players
        destroyAllVideoPlayers();

        // Clean up any video player containers (for locally created players like aeolis)
        const videoContainer = dynamicVisual.querySelector('.video-container');
        if (videoContainer) {
          videoContainer.remove();
        }

        console.log('All video players destroyed on mouse leave');
      });
    }
  }
});

// Set fixed visual area size for sub-pages on load
document.addEventListener('DOMContentLoaded', () => {
  setFixedVisualAreaSize();
});

// Signal that the page has loaded (e.g., for CSS to fade in content).
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
  performance.mark('page-fully-loaded');
  
  // Initialize video player for AttackVector page if we're on that page
  if (!isIndexPage && window.location.pathname.includes('attackvector')) {
    initializeAttackVectorVideo();
  }
  
  // Initialize video player for MEGAHERB page if we're on that page
  if (!isIndexPage && window.location.pathname.includes('megaherb')) {
    initializeMegaherbVideo();
  }

  // Initialize video player for JOURNALS page if we're on that page
  if (!isIndexPage && window.location.pathname.includes('journals')) {
    initializeJournalsVideo();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  performance.mark('main-js-dom-loaded');
  
  const localGlitchElements = document.querySelectorAll('.local-glitch-text');
  const glitchCircleRadius = 75;



  // -------------------------------------------------------------
  // High-performance mouse handler - only runs when mouse moves
  // -------------------------------------------------------------
  const floatingTitle = document.querySelector('.floating-title');
  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;
  let isMouseMoving = false;
  let mouseStopTimeout = null;

  const updateMouseReactiveEffects = () => {
    // ---------------- Glitch aura (simplified for performance) ----------------
    localGlitchElements.forEach(el => {
      const rect = el.getBoundingClientRect();

      // Find the point on the element's edge closest to the mouse.
      const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));
      const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));

      // Distance from the mouse to that point.
      const distanceToRectEdge = Math.hypot(mouseX - closestX, mouseY - closestY);

      if (distanceToRectEdge <= glitchCircleRadius) {
        el.classList.add('glitch-active');
        const proximityFactor = (glitchCircleRadius - distanceToRectEdge) / glitchCircleRadius;
        el.style.setProperty('--glitch-intensity', (Math.max(0, proximityFactor) * 1.5).toFixed(3));
      } else {
        el.classList.remove('glitch-active');
        el.style.setProperty('--glitch-intensity', '0');
      }
    });

      // Floating title no longer follows mouse - CSS animation handles drift

    // Clear RAF ID since we're done
    rafId = null;
  };

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Only schedule RAF if one isn't already scheduled
    if (rafId === null) {
      rafId = requestAnimationFrame(updateMouseReactiveEffects);
    }
    
    // Track mouse movement state
    isMouseMoving = true;
    clearTimeout(mouseStopTimeout);
    mouseStopTimeout = setTimeout(() => {
      isMouseMoving = false;
    }, 100); // Mouse considered stopped after 100ms
  }, { passive: true });

  // Reduced frequency for random glitch effects
  setInterval(() => {
    if (Math.random() > 0.8) { // Only 20% chance to trigger
      const randomElement = localGlitchElements[Math.floor(Math.random() * localGlitchElements.length)];
      if (randomElement && !randomElement.classList.contains('glitch-active')) {
        randomElement.classList.add('glitch-active');
        randomElement.style.setProperty('--glitch-intensity', Math.random() * 0.3 + 0.1);
        setTimeout(() => {
          if (!randomElement.matches(':hover')) {
              randomElement.classList.remove('glitch-active');
              randomElement.style.setProperty('--glitch-intensity', 0);
          }
        }, 150 + Math.random() * 200);
      }
    }
  }, 12000 + Math.random() * 8000); // Much less frequent
  
  performance.mark('glitch-effects-initialized');
});

// "YOU ARE HERE" effect for the AEOLIS project
const aeolisTitle = document.getElementById('project-title-3');

if (aeolisTitle) {
  const originalText = aeolisTitle.textContent.trim();
  const originalDataText = aeolisTitle.getAttribute('data-text');
  const hoverText = 'YOU ARE HERE';

  aeolisTitle.addEventListener('mouseover', () => {
    aeolisTitle.textContent = hoverText;
    aeolisTitle.setAttribute('data-text', hoverText);
    aeolisTitle.classList.add('glitch-active');
    aeolisTitle.style.setProperty('--glitch-intensity', '1');
  });

  aeolisTitle.addEventListener('mouseout', () => {
    aeolisTitle.textContent = originalText;
    aeolisTitle.setAttribute('data-text', originalDataText);
    aeolisTitle.classList.remove('glitch-active');
    aeolisTitle.style.setProperty('--glitch-intensity', '0.5');
  });
}

// Much reduced screen flicker frequency for better performance
setInterval(() => {
  if (Math.random() > 0.9) { // Only 10% chance
    const body = document.body;
    body.style.filter = 'brightness(1.02) contrast(1.01)'; // Very subtle
    setTimeout(() => {
      body.style.filter = 'brightness(0.99) contrast(0.99)';
      setTimeout(() => {
        body.style.filter = '';
      }, 20);
    }, 20);
  }
}, 45000 + Math.random() * 30000); // Much less frequent

// Export initialization function for dynamic content
window.initializePageScripts = function() {
  // Re-run initialization for dynamically loaded content
  document.querySelectorAll('.project').forEach((project, i) => {
    project.style.animationDelay = `${0.1 + i * 0.1}s`;
  });
  
  // Re-initialize glitch effects
  const event = new Event('DOMContentLoaded');
  document.dispatchEvent(event);
};

// Function to initialize and auto-play video on attackvector page
window.initializeAttackVectorVideo = async function initializeAttackVectorVideo() {
  attackVectorVideoPlayer = await initializePageMedia(
    'attackvector',
    [
      'assets/video/Gameplay.Demonstration.mp4',
      'assets/video/Gameplay.Demonstration2.mp4',
      'assets/video/Gameplay.Demonstration3.mp4'
    ],
    { fadeDuration: 600, gapDuration: 200, loop: true },
    { fitClass: 'video-fit', useEventResize: false, maxWidth: 0.9, maxHeight: 400 }
  );
};

// Function to initialize and auto-play video on reptify page
window.initializeReptifyVideo = async function initializeReptifyVideo() {
  reptifyVideoPlayer = await initializePageMedia(
    'reptify',
    [
      'assets/images/reptify loading screen.png',
      'assets/images/reptify sign in.png',
      'assets/images/reptify home.png',
      'assets/images/reptify settings.png',
      'assets/images/reptify calculator.png',
      'assets/images/reptify timer.png',
      'assets/video/biggener demo.mp4'
    ],
    { fadeDuration: 600, gapDuration: 200, loop: true, imageDuration: 1500 },
    { fitClass: 'video-fit', useEventResize: true, maxWidth: 0.95, maxHeight: 600 }
  );
};

// Function to initialize and auto-play image slideshow on megaherb page
window.initializeMegaherbVideo = async function initializeMegaherbVideo() {
  megaherbVideoPlayer = await initializePageMedia(
    'megaherb',
    [
      'assets/images/beta testing with cat.jpg',
      'assets/images/building microphone.jpg',
      'assets/images/form acceptance.png',
      'assets/images/microphone closeup.jpg'
    ],
    { fadeDuration: 600, gapDuration: 200, loop: true, imageDuration: 2000 },
    { fitClass: 'image-fit', useEventResize: true, maxWidth: 0.9, maxHeight: 500 }
  );
};

// Function to initialize and auto-play image slideshow on journals page
window.initializeJournalsVideo = async function initializeJournalsVideo() {
  journalsVideoPlayer = await initializePageMedia(
    'journals',
    [
      'assets/images/journals.png',
      'assets/images/vutu to zebra.png'
    ],
    { fadeDuration: 600, gapDuration: 200, loop: true, imageDuration: 2000 },
    { fitClass: 'image-fit', useEventResize: true, maxWidth: 0.9, maxHeight: 500 }
  );
};

// Clean up video players on page unload
window.addEventListener('beforeunload', () => {
  destroyAllVideoPlayers();
}); 