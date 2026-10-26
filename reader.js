(() => {
  'use strict';
  const scenes = JSON.parse(document.getElementById('scene-data').textContent);
  const dialog = document.getElementById('scene-viewer');
  const image = document.getElementById('full-scene-image');
  const status = document.getElementById('scene-image-status');
  let edition = 'gray';
  let current = 0;
  let opener;
  const path = scene => scene[edition];
  function render() {
    const scene = scenes[current];
    document.getElementById('scene-viewer-title').textContent = scene.title;
    document.getElementById('scene-count').textContent = `${current + 1} / ${scenes.length} · Arrow keys to browse`;
    document.getElementById('scene-prev').disabled = current === 0;
    document.getElementById('scene-next').disabled = current === scenes.length - 1;
    document.getElementById('scene-original').href = path(scene);
    image.alt = scene.alt;
    if (image.getAttribute('src') !== path(scene)) {
      status.textContent = 'Loading artwork…';
      image.src = path(scene);
    }
  }
  function changeEdition(next) {
    edition = next;
    document.querySelectorAll('[data-edition]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.edition === edition)));
    document.querySelectorAll('img[data-gray]').forEach(img => { img.src = img.dataset[edition]; });
    document.querySelectorAll('[data-scene]').forEach(link => { link.href = path(scenes.find(scene => scene.id === link.dataset.scene)); });
    document.getElementById('edition-status').textContent = `${edition === 'gray' ? 'Grayscale' : 'Watercolor'} selected for all ${scenes.length} scenes.`;
    if (dialog.open) render();
  }
  document.querySelectorAll('.edition-control').forEach(control => { control.hidden = false; });
  document.querySelectorAll('[data-edition]').forEach(button => button.addEventListener('click', () => changeEdition(button.dataset.edition)));
  image.addEventListener('load', () => { status.textContent = ''; });
  image.addEventListener('error', () => { status.textContent = 'The image could not load. Try the original-size link below.'; });
  // Real image links still work without scripting or native dialog support.
  if (typeof dialog.showModal !== 'function') return;
  document.querySelectorAll('[data-scene]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    opener = link;
    current = scenes.findIndex(scene => scene.id === link.dataset.scene);
    render();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('viewer-open');
    document.getElementById('scene-close').focus();
  }));
  function step(by) {
    current = Math.max(0, Math.min(scenes.length - 1, current + by));
    render();
  }
  document.getElementById('scene-prev').addEventListener('click', () => step(-1));
  document.getElementById('scene-next').addEventListener('click', () => step(1));
  document.getElementById('scene-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    opener?.focus({preventScroll:true});
  });
})();
