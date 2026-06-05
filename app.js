(function(){
  var logo = document.querySelector('.type-logo');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!logo || reducedMotion) return;

  var live = logo.querySelector('.type-live');
  var text = logo.getAttribute('data-type-text') || '';
  var index = 0;

  logo.classList.add('is-typing');
  live.textContent = '';

  window.setTimeout(function typeNext(){
    live.textContent = text.slice(0, index);
    index += 1;
    if(index <= text.length + 1){
      window.setTimeout(typeNext, 95);
    }
  }, 260);
})();
