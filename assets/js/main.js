document.querySelectorAll('.project').forEach((el, i) => {
  el.style.animationDelay = `${0.2 + i * 0.1}s`;
}); 