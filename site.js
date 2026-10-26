const button = document.getElementById('edition-toggle');
const picture = document.getElementById('park-image');
const label = document.getElementById('edition-label');
button.hidden = false;
button.addEventListener('click', () => {
  const color = button.getAttribute('aria-pressed') !== 'true';
  picture.src = color ? 'assets/midway-watercolor.png' : 'assets/midway-grayscale.png';
  button.setAttribute('aria-pressed', String(color));
  button.textContent = color ? 'Show black & white ↗' : 'Show watercolor ↗';
  label.textContent = `A first look at the midway · ${color ? 'Watercolor' : 'Black & white'}`;
});
