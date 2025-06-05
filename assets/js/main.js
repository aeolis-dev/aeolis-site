// Initialize project card hover effects and dynamic visual area
document.querySelectorAll('.project').forEach((project, i) => {
  // Apply a staggered entrance animation delay (if defined in CSS).
  project.style.animationDelay = `${0.1 + i * 0.1}s`;
  
  // Update CSS variables for mouse-aware hover effects on project cards.
  project.addEventListener('mousemove', (e) => {
    const x = e.clientX - project.getBoundingClientRect().left;
    const y = e.clientY - project.getBoundingClientRect().top;
    
    // These variables can be used by CSS for effects like a spotlight or gradient following the mouse.
    project.style.setProperty('--mouse-x', `${x}px`);
    project.style.setProperty('--mouse-y', `${y}px`);
  });

  // Dynamic visual area functionality
  const dynamicVisual = document.getElementById('dynamic-visual');
  if (dynamicVisual) {
    project.addEventListener('mouseenter', () => {
      const visualType = project.getAttribute('data-visual');
      // Remove all existing visual classes
      dynamicVisual.className = 'dynamic-visual';
      // Add the specific visual class
      if (visualType) {
        dynamicVisual.classList.add(visualType);
      }
    });

    project.addEventListener('mouseleave', () => {
      // Reset to default state
      dynamicVisual.className = 'dynamic-visual';
    });
  }
});

// Signal that the page has loaded (e.g., for CSS to fade in content).
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

document.addEventListener('DOMContentLoaded', () => {
  const localGlitchElements = document.querySelectorAll('.local-glitch-text');
  const glitchCircleRadius = 37.5; // Radius of the 75px diameter circular glitch aura.

  // Tracks whether the glitch aura is active for each element.
  const elementStates = new Map(); // Key: element, Value: { isActive: boolean }
  localGlitchElements.forEach(el => elementStates.set(el, { isActive: false }));

  // Display phone number if the placeholder and variable exist.
  // The 'phoneNumber' variable is expected from 'assets/js/config.js' (which is gitignored).
  // See 'assets/js/config.example.js' for setup instructions if forking this project.
  const phoneNumberPlaceholder = document.getElementById('phone-number-placeholder');
  if (phoneNumberPlaceholder && typeof phoneNumber !== 'undefined' && phoneNumber !== "YOUR_PHONE_NUMBER_HERE" && phoneNumber !== "") {
    phoneNumberPlaceholder.textContent = phoneNumber;
    phoneNumberPlaceholder.setAttribute('data-text', phoneNumber);
  }

  // Handles the mouse-tracking glitch aura effect for elements with '.local-glitch-text'.
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    localGlitchElements.forEach(el => {
      const rect = el.getBoundingClientRect(); // Gets the element's size and position.

      // Find the point on the element's edge closest to the mouse.
      const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));
      const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));

      // Calculate distance from mouse to that closest point on the element's edge.
      const distanceX = mouseX - closestX;
      const distanceY = mouseY - closestY;
      const distanceToRectEdge = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      const currentState = elementStates.get(el);

      // Check if the mouse cursor's circular aura (defined by glitchCircleRadius) overlaps the element.
      if (distanceToRectEdge <= glitchCircleRadius) {
        if (!currentState.isActive) {
          el.classList.add('glitch-active'); // Activate CSS glitch animation.
          currentState.isActive = true;
        }
        // Update CSS variables for the mask position, relative to the element's top-left corner.
        const maskX = mouseX - rect.left;
        const maskY = mouseY - rect.top;
        el.style.setProperty('--mask-x', `${maskX}px`);
        el.style.setProperty('--mask-y', `${maskY}px`);
      } else {
        // Mouse aura is not overlapping the element.
        if (currentState.isActive) {
          el.classList.remove('glitch-active'); // Deactivate CSS glitch animation.
          currentState.isActive = false;
          // Reset mask position to effectively hide it (move it far off-screen).
          el.style.setProperty('--mask-x', '-9999px');
          el.style.setProperty('--mask-y', '-9999px');
        }
      }
    });
  });

  // Enhanced floating title animation based on mouse position
  const floatingTitle = document.querySelector('.floating-title');
  if (floatingTitle) {
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Calculate offset based on mouse position (subtle parallax effect)
      const offsetX = (mouseX - centerX) * 0.01;
      const offsetY = (mouseY - centerY) * 0.01;
      
      floatingTitle.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotateX(20deg) rotateY(-10deg)`;
    });
  }
});

// Enhanced "YOU ARE HERE" effect for the AEOLIS project
const aeolisTitle = document.getElementById('project-title-3');

if (aeolisTitle) {
  const originalText = aeolisTitle.textContent.trim();
  const originalDataText = aeolisTitle.getAttribute('data-text');
  const hoverText = 'YOU ARE HERE';

  aeolisTitle.addEventListener('mouseover', () => {
    aeolisTitle.textContent = hoverText;
    aeolisTitle.setAttribute('data-text', hoverText);
    // Add enhanced glitch effect
    aeolisTitle.classList.add('glitch-active');
  });

  aeolisTitle.addEventListener('mouseout', () => {
    aeolisTitle.textContent = originalText;
    aeolisTitle.setAttribute('data-text', originalDataText);
    // Remove enhanced glitch effect
    aeolisTitle.classList.remove('glitch-active');
  });
} 