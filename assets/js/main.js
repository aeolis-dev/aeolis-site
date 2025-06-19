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
  const glitchCircleRadius = 75;

  // Display phone number if the placeholder and variable exist.
  // The 'phoneNumber' variable is expected from 'assets/js/config.js' (which is gitignored).
  // See 'assets/js/config.example.js' for setup instructions if forking this project.
  const phoneNumberPlaceholder = document.getElementById('phone-number-placeholder');
  if (phoneNumberPlaceholder && typeof phoneNumber !== 'undefined' && phoneNumber !== "YOUR_PHONE_NUMBER_HERE" && phoneNumber !== "") {
    phoneNumberPlaceholder.textContent = phoneNumber;
    phoneNumberPlaceholder.setAttribute('data-text', phoneNumber);
  }

  // -------------------------------------------------------------
  // Performance-optimised unified mouse handler
  // -------------------------------------------------------------
  // 1. We collect the latest mouse coordinates for every pointer
  //    movement but defer the expensive DOM work to the next
  //    animation frame (≈ 16 ms on 60 Hz displays).  This ensures
  //    that the heavy calculations run at most once per frame,
  //    even if the OS dispatches dozens of `mousemove` events.
  // 2. Glitch-aura and floating-title logic now run together,
  //    avoiding duplicate layouts and style recalculations.

  const floatingTitle = document.querySelector('.floating-title');
  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;

  const updateMouseReactiveEffects = () => {
    // ---------------- Glitch aura ----------------
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

    if (floatingTitle) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = (mouseX - centerX) * 0.015;
      const offsetY = (mouseY - centerY) * 0.015;
      const rotateX = (mouseY - centerY) * 0.01;
      const rotateY = (mouseX - centerX) * -0.01;

      floatingTitle.style.transform =
        `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) ` +
        `rotateX(${20 + rotateX}deg) rotateY(${-10 + rotateY}deg)`;
    }

    rafId = null;
  };

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (rafId === null) {
      rafId = requestAnimationFrame(updateMouseReactiveEffects);
    }
  }, { passive: true });

  // Add periodic glitch effects to random elements
  setInterval(() => {
    const randomElement = localGlitchElements[Math.floor(Math.random() * localGlitchElements.length)];
    if (randomElement && !randomElement.classList.contains('glitch-active')) {
      randomElement.classList.add('glitch-active');
      randomElement.style.setProperty('--glitch-intensity', Math.random() * 0.4 + 0.2);
      setTimeout(() => {
        if (!randomElement.matches(':hover')) {
            randomElement.classList.remove('glitch-active');
            randomElement.style.setProperty('--glitch-intensity', 0);
        }
      }, 200 + Math.random() * 300); // Random duration
    }
  }, 5000 + Math.random() * 5000); // Random interval
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

// Add subtle screen flicker effect occasionally
setInterval(() => {
  const body = document.body;
  body.style.filter = 'brightness(1.1) contrast(1.05)';
  setTimeout(() => {
    body.style.filter = 'brightness(0.95) contrast(0.98)';
    setTimeout(() => {
      body.style.filter = '';
    }, 50);
  }, 50);
}, 15000 + Math.random() * 45000); // Random interval between 15-60 seconds 