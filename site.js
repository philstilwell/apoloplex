(() => {
  'use strict';
  const items = JSON.parse(document.getElementById('gallery-data').textContent);
  const byId = new Map(items.map(item => [item.id, item]));
  const dialog = document.getElementById('gallery-viewer');
  const image = document.getElementById('viewer-image');
  const status = document.getElementById('viewer-image-status');
  let current = null;
  let opener = null;

  const pathFor = item => item.color;
  const setText = (id, text) => { document.getElementById(id).textContent = text; };
  function renderViewer() {
    const group = items.filter(item => item.group === current.group);
    const index = group.findIndex(item => item.id === current.id);
    const cast = current.group === 'cast';
    const welcome = current.group === 'welcome';
    setText('viewer-count', `${cast ? 'The cast' : welcome ? 'Welcome' : 'The park'} / ${index + 1} of ${group.length}`);
    setText('viewer-kind', cast ? `Fictional comic role · Watercolor character sheet` : welcome ? `Watercolor · The whole cast` : `Watercolor · Apoloplex attraction`);
    document.getElementById('viewer-prev').disabled = group.length < 2;
    document.getElementById('viewer-next').disabled = group.length < 2;
    setText('viewer-title', current.title);
    setText('viewer-subtitle', current.subtitle);
    setText('viewer-description', current.description);
    setText('viewer-scene', current.scene);
    setText('viewer-question', `${cast ? 'The visitor’s question: ' : welcome ? 'The cast: ' : 'Questions around the queue: '}${current.question}`);
    document.getElementById('viewer-original').href = pathFor(current);
    image.alt = current.alt;
    const next = pathFor(current);
    if (image.getAttribute('src') !== next) {
      status.textContent = 'Loading artwork…';
      image.src = next;
    }
  }
  image.addEventListener('load', () => { status.textContent = ''; });
  image.addEventListener('error', () => { status.textContent = 'The artwork could not load. Try opening the full image below.'; });

  // Ordinary image links remain usable if JavaScript or dialog support is unavailable.
  if (typeof dialog.showModal !== 'function') return;
  document.querySelectorAll('[data-gallery]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const item = byId.get(link.dataset.gallery);
      if (!item) return;
      event.preventDefault();
      opener = link;
      current = item;
      renderViewer();
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('viewer-open');
      document.getElementById('viewer-close').focus();
    });
  });
  function step(direction) {
    const group = items.filter(item => item.group === current.group);
    const index = group.findIndex(item => item.id === current.id);
    current = group[(index + direction + group.length) % group.length];
    renderViewer();
  }
  document.getElementById('viewer-prev').addEventListener('click', () => step(-1));
  document.getElementById('viewer-next').addEventListener('click', () => step(1));
  document.getElementById('viewer-close').addEventListener('click', () => dialog.close());
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
    if (opener) opener.focus({preventScroll:true});
  });
})();
