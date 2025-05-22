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