(function() {
  var variant = localStorage.getItem('appliedThemeClass') || 'default';
  var docEl = document.documentElement;

  // Add classes synchronously. This is blocking, so it happens before render.
  docEl.classList.add('no-transitions', 'theme-' + variant);

  // Remove the 'no-transitions' class after the page has loaded,
  // allowing subsequent user-initiated theme changes to animate.
  // We use a small timeout to ensure it happens after the initial paint.
  window.addEventListener('load', function() {
    setTimeout(function() {
      docEl.classList.remove('no-transitions');
      // Ensure transitions are fully enabled for theme changes
      document.body.style.transition = 'background-color 0.8s ease, color 0.8s ease';
    }, 50); // Slightly longer delay to ensure full load
  });
})(); 