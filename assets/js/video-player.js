// High-performance video player with single decoder and visibility optimization
class VideoPlayer {
  constructor(container, mediaItems, options = {}) {
    this.container = container;
    this.mediaItems = mediaItems; // Can be videos or images
    this.currentIndex = 0;
    this.options = {
      fadeDuration: 500,
      gapDuration: 200,
      loop: true,
      imageDuration: 1500, // Duration to show each image (1.5 seconds)
      ...options
    };
    
    this.video = null;
    this.imageElement = null;
    this.isPlaying = false;
    this.initialized = false;
    this.isDestroyed = false;
    this.isVisible = true;
    this.intersectionObserver = null;
    this.imageTimer = null;
    
    console.log('VideoPlayer created with media items:', this.mediaItems);
  }

  async init() {
    if (this.initialized || this.isDestroyed) return;
    
    console.log('Initializing video player...');
    
    // Create single video element for better performance
    this.video = document.createElement('video');
    
    // Performance optimizations
    this.video.preload = 'none';
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.loop = false; // We handle looping ourselves for mixed media
    this.video.disablePictureInPicture = true;
    this.video.controls = false;
    
    // Optimized positioning
    this.video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      opacity: 0;
      transition: opacity ${this.options.fadeDuration}ms ease;
      z-index: 10;
      border-radius: 6px;
    `;
    
    // Create image element for slideshow
    this.imageElement = document.createElement('img');
    this.imageElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      opacity: 0;
      transition: opacity ${this.options.fadeDuration}ms ease;
      z-index: 10;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.1);
    `;
    
    // Error handling
    this.video.addEventListener('error', (e) => {
      console.error('Video error:', e.target.error);
      this.showErrorMessage();
    });
    
    this.video.addEventListener('loadstart', () => {
      console.log('Video loading started');
    });
    
    this.video.addEventListener('canplaythrough', () => {
      console.log('Video can play through');
    });
    
    this.video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded, dimensions:', this.video.videoWidth, 'x', this.video.videoHeight);
    });
    
    this.video.addEventListener('ended', () => {
      console.log('Video ended');
      this.handleMediaEnd();
    });
    
    // Set up intersection observer for performance
    this.setupVisibilityObserver();
    
    this.container.appendChild(this.video);
    this.container.appendChild(this.imageElement);
    this.initialized = true;
    
    console.log('Video player initialized successfully');
  }

  setupVisibilityObserver() {
    // Pause video when not visible to save resources
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          if (!this.isVisible && this.isPlaying) {
            console.log('Video area not visible, pausing for performance');
            this.pause();
          }
        });
      },
      { threshold: 0.1 } // Pause when less than 10% visible
    );
    
    this.intersectionObserver.observe(this.container);
  }

  isCurrentItemVideo() {
    const currentItem = this.mediaItems[this.currentIndex];
    return currentItem && (currentItem.endsWith('.mp4') || currentItem.endsWith('.webm') || currentItem.endsWith('.mov'));
  }

  isCurrentItemImage() {
    const currentItem = this.mediaItems[this.currentIndex];
    return currentItem && (currentItem.endsWith('.png') || currentItem.endsWith('.jpg') || currentItem.endsWith('.jpeg') || currentItem.endsWith('.webp'));
  }

  async loadMedia(index) {
    if (!this.video || this.isDestroyed) return;
    
    const mediaPath = this.mediaItems[index];
    console.log(`Loading media ${index}:`, mediaPath);
    
    // Fade out during transition
    this.video.style.opacity = '0';
    this.imageElement.style.opacity = '0';
    
    // Small delay for fade effect
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.isCurrentItemVideo()) {
      // Load video
      this.video.src = mediaPath;
      this.video.load();
      
      // Wait for video to be ready
      return new Promise((resolve) => {
        const onCanPlay = () => {
          this.video.removeEventListener('canplaythrough', onCanPlay);
          this.video.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          this.video.removeEventListener('canplaythrough', onCanPlay);
          this.video.removeEventListener('error', onError);
          console.error(`Failed to load video ${index}`);
          resolve(); // Continue anyway
        };
        
        this.video.addEventListener('canplaythrough', onCanPlay);
        this.video.addEventListener('error', onError);
      });
    } else if (this.isCurrentItemImage()) {
      // Load image
      return new Promise((resolve) => {
        const onLoad = () => {
          this.imageElement.removeEventListener('load', onLoad);
          this.imageElement.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          this.imageElement.removeEventListener('load', onLoad);
          this.imageElement.removeEventListener('error', onError);
          console.error(`Failed to load image ${index}`);
          resolve(); // Continue anyway
        };
        
        this.imageElement.src = mediaPath;
        this.imageElement.addEventListener('load', onLoad);
        this.imageElement.addEventListener('error', onError);
      });
    }
  }

  async play() {
    if (this.isDestroyed || !this.isVisible) return;
    
    if (!this.initialized) {
      await this.init();
    }
    
    // Always start fresh - reset state
    this.isPlaying = false;
    this.currentIndex = 0;
    
    console.log('Starting media playback');
    this.isPlaying = true;
    this.container.parentElement?.classList.add('playing');
    
    // Load and play first media item
    await this.loadMedia(this.currentIndex);
    this.startPlayback();
  }

  async startPlayback() {
    if (!this.isPlaying || this.isDestroyed || !this.isVisible) return;
    
    // Fade in and play
    if (this.isCurrentItemVideo()) {
      this.video.style.opacity = '1';
      this.imageElement.style.opacity = '0';
      
      try {
        await this.video.play();
        console.log(`Video ${this.currentIndex} started playing`);
        
        // Trigger resize event for video
        this.triggerResizeEvent();
      } catch (error) {
        console.error(`Video ${this.currentIndex} play failed:`, error);
      }
    } else if (this.isCurrentItemImage()) {
      this.imageElement.style.opacity = '1';
      this.video.style.opacity = '0';
      
      console.log(`Image ${this.currentIndex} started displaying`);
      
      // Trigger resize event for image
      this.triggerResizeEvent();
      
      // Set timer for image duration
      this.imageTimer = setTimeout(() => {
        if (this.isPlaying) {
          this.handleMediaEnd();
        }
      }, this.options.imageDuration);
    }
  }

  triggerResizeEvent() {
    // Dispatch a custom event that the main.js can listen for
    const resizeEvent = new CustomEvent('mediaResize', {
      detail: {
        player: this,
        currentIndex: this.currentIndex,
        isVideo: this.isCurrentItemVideo(),
        isImage: this.isCurrentItemImage()
      }
    });
    this.container.dispatchEvent(resizeEvent);
  }

  async handleMediaEnd() {
    if (!this.isPlaying || this.isDestroyed || !this.isVisible) return;
    
    // Clear any existing image timer
    if (this.imageTimer) {
      clearTimeout(this.imageTimer);
      this.imageTimer = null;
    }
    
    // Move to next media item
    this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
    console.log(`Switching to media ${this.currentIndex}`);
    
    // Small gap between media items
    await new Promise(resolve => setTimeout(resolve, this.options.gapDuration));
    
    if (this.isPlaying && this.options.loop) {
      await this.loadMedia(this.currentIndex);
      this.startPlayback();
    }
  }

  pause() {
    console.log('Pausing media playback');
    this.isPlaying = false;
    this.container.parentElement?.classList.remove('playing');
    
    // Clear image timer
    if (this.imageTimer) {
      clearTimeout(this.imageTimer);
      this.imageTimer = null;
    }
    
    if (this.video) {
      this.video.pause();
      this.video.style.opacity = '0';
    }
    
    if (this.imageElement) {
      this.imageElement.style.opacity = '0';
    }
  }

  stop() {
    console.log('Stopping media playback');
    this.isPlaying = false;
    this.container.parentElement?.classList.remove('playing');
    
    // Clear image timer
    if (this.imageTimer) {
      clearTimeout(this.imageTimer);
      this.imageTimer = null;
    }
    
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0; // Reset to beginning
      this.video.style.opacity = '0';
    }
    
    if (this.imageElement) {
      this.imageElement.style.opacity = '0';
    }
  }

  showErrorMessage() {
    const error = document.createElement('div');
    error.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: rgba(255, 255, 255, 0.9);
      padding: 1rem;
      border-radius: 6px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.9rem;
      z-index: 20;
      max-width: 80%;
    `;
    
    error.innerHTML = `
      <div style="margin-bottom: 0.5rem;">⚠️ Media Error</div>
      <div style="font-size: 0.8rem; opacity: 0.8;">
        Unable to load media file
      </div>
    `;
    
    this.container.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }

  destroy() {
    console.log('Destroying video player');
    this.isDestroyed = true;
    this.stop();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    // Clear image timer
    if (this.imageTimer) {
      clearTimeout(this.imageTimer);
      this.imageTimer = null;
    }
    
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
      this.video.remove();
      this.video = null;
    }
    
    if (this.imageElement) {
      this.imageElement.removeAttribute('src');
      this.imageElement.remove();
      this.imageElement = null;
    }
    
    this.initialized = false;
    this.isPlaying = false;
  }
}

// Export for use in other scripts
window.VideoPlayer = VideoPlayer; 