(() => {
  'use strict';
  const scenes = JSON.parse(document.getElementById('scene-data').textContent);
  const dialog = document.getElementById('scene-viewer');
  const image = document.getElementById('full-scene-image');
  const status = document.getElementById('scene-image-status');
  const viewport = document.getElementById('scene-image-viewport');
  const zoom = document.getElementById('scene-zoom');
  const transcript = document.getElementById('viewer-transcript');
  let zoomed = false;
  let current = 0;
  let opener;
  const path = scene => scene.color;
  function setZoom(next) {
    zoomed = next;
    viewport.classList.toggle('is-zoomed', zoomed);
    viewport.tabIndex = zoomed ? 0 : -1;
    zoom.textContent = zoomed ? 'Fit image' : 'Zoom in';
    zoom.setAttribute('aria-pressed', String(zoomed));
    document.getElementById('scene-zoom-hint').textContent = zoomed
      ? 'Scroll or swipe to move around the enlarged image.'
      : 'Choose Zoom in for full-size lettering.';
    viewport.scrollTo(0, 0);
    dialog.scrollTop = 0;
  }
  function render() {
    const scene = scenes[current];
    document.getElementById('scene-viewer-title').textContent = scene.title;
    document.getElementById('scene-count').textContent = `Scene ${current + 1} of ${scenes.length}`;
    document.getElementById('scene-prev').disabled = current === 0;
    document.getElementById('scene-next').disabled = current === scenes.length - 1;
    document.getElementById('scene-original').href = path(scene);
    image.alt = scene.alt;
    viewport.style.setProperty('--scene-native-width', `${scene.width}px`);
    viewport.scrollTo(0, 0);
    document.getElementById('viewer-scene-description').textContent = scene.description;
    const lines = scene.dialogue.map(line => {
      const paragraph = document.createElement('p');
      const speaker = document.createElement('strong');
      speaker.textContent = `${line.speaker}: `;
      paragraph.append(speaker, document.createTextNode(line.text));
      return paragraph;
    });
    document.getElementById('viewer-dialogue').replaceChildren(...lines);
    transcript.scrollTop = 0;
    if (image.getAttribute('src') !== path(scene)) {
      status.textContent = 'Loading artwork…';
      image.src = path(scene);
    }
  }
  image.addEventListener('load', () => { status.textContent = ''; });
  image.addEventListener('error', () => { status.textContent = 'The image could not load. Try the original-size link below.'; });
  // Real image links still work without scripting or native dialog support.
  if (typeof dialog.showModal !== 'function') return;
  document.querySelectorAll('[data-scene]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    opener = link;
    current = scenes.findIndex(scene => scene.id === link.dataset.scene);
    setZoom(false);
    transcript.open = false;
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
  zoom.addEventListener('click', () => {
    setZoom(!zoomed);
    if (zoomed) viewport.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', event => {
    if (zoomed && viewport.contains(event.target)) return;
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
