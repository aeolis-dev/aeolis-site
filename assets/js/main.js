// Initialize project card hover effects and animations.
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
});

// Signal that the page has loaded (e.g., for CSS to fade in content).
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Dynamically set random animation duration for the main H1 title's glitch effect.
const titleElement = document.querySelector('h1');

function setRandomGlitchDurationForTitle() {
  // Check if the titleElement exists and does not have 'local-glitch-text' 
  // (as that class has its own JS-controlled animation states).
  if (titleElement && !titleElement.classList.contains('local-glitch-text')) {
    const minDuration = 2; // seconds
    const maxDuration = 7; // seconds
    // Random duration (e.g., 2.0s to 7.0s).
    const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration;
    titleElement.style.animationDuration = `${randomDuration.toFixed(1)}s`;
  }
}

// Initial setup for H1 title glitch animation, if applicable.
if (titleElement && !titleElement.classList.contains('local-glitch-text')) {
  setRandomGlitchDurationForTitle(); // Set an initial random duration.
  // Update duration upon each completion of the animation iteration for variety.
  // Note: 'animationiteration' event fires when an iteration of an animation ends.
  titleElement.addEventListener('animationiteration', setRandomGlitchDurationForTitle);
}

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

  // Note: The local glitch effect is primarily activated by mouse movement.
  // For an effect on page load without mouse interaction, a more complex solution
  // (e.g., manually triggering a check after a timeout) might be needed.
}); 