(() => {
  'use strict';
  // Reveal the nested form when returning from the email service or a saved link.
  function revealFeedback() {
    if (location.hash !== '#feedback' && location.hash !== '#feedback-sent') return;
    const target = document.getElementById(location.hash.slice(1));
    const accordion = target?.closest('details.closing-article');
    if (!accordion) return;
    accordion.open = true;
    requestAnimationFrame(() => target.scrollIntoView({behavior:'instant', block:'start'}));
  }
  revealFeedback();
  window.addEventListener('hashchange', revealFeedback);
  // Keep scene jumps clear of both sticky bars, including wrapped phone layouts.
  const header = document.querySelector('.masthead');
  const guide = document.querySelector('.reader-guide');
  const readingSteps = [...(guide?.querySelectorAll('a[href^="#scene-"]') || [])]
    .map(link => ({link, section: document.getElementById(link.hash.slice(1))}))
    .filter(step => step.section);
  const stickyHeaderHeight = () => header && getComputedStyle(header).position === 'sticky' ? Math.ceil(header.getBoundingClientRect().height) : 0;
  const resume = document.getElementById('resume-reading');
  const resumeKey = 'apoloplex:reading:' + location.pathname;
  let savedScene = null;
  let readingInteracted = false;
  try { savedScene = localStorage.getItem(resumeKey); } catch (_) { /* Reading works when storage is unavailable. */ }
  const markReadingInteraction = () => { readingInteracted = true; };
  window.addEventListener('wheel', markReadingInteraction, {passive:true});
  window.addEventListener('touchstart', markReadingInteraction, {passive:true});
  document.addEventListener('keydown', markReadingInteraction);
  guide?.addEventListener('click', markReadingInteraction);
  let activeStep = null;
  let readingFrame = 0;
  function updateActiveScene() {
    readingFrame = 0;
    if (!readingSteps.length) return;
    // A scene remains current through its notes until the next scene reaches this line.
    const readingLine = stickyHeaderHeight()
      + Math.ceil(guide?.getBoundingClientRect().height || 0) + 18;
    let next = readingSteps[0];
    for (const step of readingSteps) {
      if (step.section.getBoundingClientRect().top > readingLine) break;
      next = step;
    }
    if (readingInteracted) {
      try { localStorage.setItem(resumeKey, next.section.id); } catch (_) {}
    }
    if (next === activeStep) return;
    activeStep?.link.removeAttribute('aria-current');
    next.link.setAttribute('aria-current', 'location');
    activeStep = next;
    const nav = next.link.parentElement;
    if (nav.scrollWidth > nav.clientWidth) {
      const linkBox = next.link.getBoundingClientRect(), navBox = nav.getBoundingClientRect();
      if (linkBox.left < navBox.left) nav.scrollLeft -= navBox.left - linkBox.left;
      else if (linkBox.right > navBox.right) nav.scrollLeft += linkBox.right - navBox.right;
    }
  }
  function scheduleActiveScene() {
    if (!readingFrame) readingFrame = requestAnimationFrame(updateActiveScene);
  }
  window.addEventListener('scroll', scheduleActiveScene, {passive:true});
  window.addEventListener('resize', scheduleActiveScene);
  window.addEventListener('pageshow', scheduleActiveScene);
  document.addEventListener('toggle', scheduleActiveScene, true);
  scheduleActiveScene();
  if (header && guide) {
    const measureBars = () => {
      document.documentElement.style.setProperty('--reader-header-height', `${stickyHeaderHeight()}px`);
      document.documentElement.style.setProperty('--reader-guide-height', `${Math.ceil(guide.getBoundingClientRect().height)}px`);
      scheduleActiveScene();
    };
    measureBars();
    window.addEventListener('resize', measureBars);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(measureBars);
      observer.observe(header);
      observer.observe(guide);
    } else {
      window.addEventListener('resize', measureBars);
    }
  }
  const savedStep = readingSteps.find(step => step.section.id === savedScene);
  if (resume && savedStep && savedStep !== readingSteps[0]) {
    resume.hidden = false;
    resume.textContent = `Resume at scene ${readingSteps.indexOf(savedStep) + 1}`;
    resume.addEventListener('click', () => {
      readingInteracted = true;
      history.replaceState(history.state, '', savedStep.link.hash);
      savedStep.section.scrollIntoView({behavior:'instant', block:'start'});
      savedStep.link.focus({preventScroll:true});
      resume.hidden = true;
      updateActiveScene();
    });
  }
  const scenes = JSON.parse(document.getElementById('scene-data').textContent);
  const dialog = document.getElementById('scene-viewer');
  document.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
    // Dialogs and editing controls keep their own arrow-key behavior.
    if (document.querySelector('dialog[open]') || event.target.isContentEditable
      || event.target.closest('input, textarea, select, [role="textbox"], [role="slider"], [role="combobox"], [role="listbox"]')) return;
    updateActiveScene();
    const index = readingSteps.indexOf(activeStep);
    if (index < 0) return;
    event.preventDefault();
    const next = readingSteps[index + (event.key === 'ArrowLeft' ? -1 : 1)];
    if (!next) return;
    // An immediate jump also lets repeated presses advance reliably.
    history.replaceState(history.state, '', next.link.hash);
    next.section.scrollIntoView({behavior:'instant', block:'start'});
    next.link.focus({preventScroll:true});
    updateActiveScene();
  });
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
    const deeperDive = document.getElementById('viewer-deeper-dive');
    if (deeperDive) {
      deeperDive.replaceChildren(...(scene.deeper_dive || []).map(block => {
        const section = document.createElement('section');
        section.className = 'argument-block';
        const heading = document.createElement('h3');
        heading.textContent = block.heading;
        section.append(heading, ...block.paragraphs.map(text => {
          const paragraph = document.createElement('p');
          paragraph.textContent = text;
          return paragraph;
        }));
        return section;
      }));
      document.getElementById('viewer-accessibility').open = false;
    }
    transcript.scrollTop = 0;
    const readingPanel = dialog.querySelector('.viewer-reading');
    if (readingPanel) readingPanel.scrollTop = 0;
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
    setZoom(false);
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
