// Add subtle hover effect to project cards
document.querySelectorAll('.project').forEach((project, i) => {
  // Staggered animation delay
  project.style.animationDelay = `${0.1 + i * 0.1}s`;
  
  // Random angular element on hover
  project.addEventListener('mousemove', (e) => {
    const x = e.clientX - project.getBoundingClientRect().left;
    const y = e.clientY - project.getBoundingClientRect().top;
    
    // Update position of after element
    project.style.setProperty('--mouse-x', `${x}px`);
    project.style.setProperty('--mouse-y', `${y}px`);
  });
});

// Add page load effect
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Randomize title glitch animation duration
const titleElement = document.querySelector('h1');

function setRandomGlitchDuration() {
  if (titleElement && titleElement.classList.contains('local-glitch-text') === false) {
    // Random duration between 2 and 7 seconds (inclusive of 2, exclusive of 7, so add 1 to max and use floor)
    // Or more precisely, between 2.0 and 7.0 seconds
    const minDuration = 2;
    const maxDuration = 7;
    const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration;
    titleElement.style.animationDuration = `${randomDuration.toFixed(1)}s`;
    // console.log(`New glitch duration: ${randomDuration.toFixed(1)}s`); // For debugging
  }
}

if (titleElement && titleElement.classList.contains('local-glitch-text') === false) {
  // Set initial random duration
  setRandomGlitchDuration();

  // Update duration on each animation iteration
  // Note: 'animationiteration' fires when an iteration of an animation ends.
  titleElement.addEventListener('animationiteration', setRandomGlitchDuration);
}

document.addEventListener('DOMContentLoaded', () => {
  const localGlitchElements = document.querySelectorAll('.local-glitch-text');
  const glitchCircleRadius = 37.5; // Radius of the 75px diameter glitch circle

  // Store the state of each element (whether it's currently glitched)
  const elementStates = new Map(); // el => { isActive: boolean }
  localGlitchElements.forEach(el => elementStates.set(el, { isActive: false }));

  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    localGlitchElements.forEach(el => {
      const rect = el.getBoundingClientRect();

      // Calculate the closest point on the element's bounding box to the mouse cursor
      const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));
      const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));

      // Calculate the distance from the mouse cursor to this closest point
      const distanceX = mouseX - closestX;
      const distanceY = mouseY - closestY;
      const distanceToRectEdge = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      const currentState = elementStates.get(el);

      if (distanceToRectEdge <= glitchCircleRadius) {
        // Mouse cursor's 75px circle is overlapping or touching the element
        if (!currentState.isActive) {
          el.classList.add('glitch-active');
          currentState.isActive = true;
        }
        // Calculate mask position relative to the element's top-left
        const maskX = mouseX - rect.left;
        const maskY = mouseY - rect.top;
        el.style.setProperty('--mask-x', `${maskX}px`);
        el.style.setProperty('--mask-y', `${maskY}px`);
      } else {
        // Mouse cursor's 75px circle is NOT overlapping the element
        if (currentState.isActive) {
          el.classList.remove('glitch-active');
          currentState.isActive = false;
          // Reset mask position to effectively hide it
          el.style.setProperty('--mask-x', '-9999px');
          el.style.setProperty('--mask-y', '-9999px');
        }
      }
    });
  });

  // Initial check in case the mouse is already over an element on load (though less likely without initial mousemove)
  // For a more robust solution on load, you might need to trigger a manual check after a brief timeout.
  // However, the effect is primarily interactive with mouse movement.

  // Keep existing H1 title glitch randomization logic 
  const titleElement = document.querySelector('h1');
  function setRandomGlitchDuration() {
    if (titleElement && titleElement.classList.contains('local-glitch-text') === false) { 
      const minDuration = 2;
      const maxDuration = 7;
      const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration;
      if(getComputedStyle(titleElement).animationName && getComputedStyle(titleElement).animationName.includes('titleGlitch')){
        titleElement.style.animationDuration = `${randomDuration.toFixed(1)}s`;
      }
    }
  }
  if (titleElement && titleElement.classList.contains('local-glitch-text') === false) {
    if(getComputedStyle(titleElement).animationName && getComputedStyle(titleElement).animationName.includes('titleGlitch')){
        setRandomGlitchDuration();
        titleElement.addEventListener('animationiteration', setRandomGlitchDuration);
    }
  }
}); 