const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const swatchesContainer = document.getElementById('swatches');

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

 console.log('file.path:', file.path); 
  const isHeic = /\.(heic|heif)$/i.test(file.name);

  if (isHeic) {
    const filePath = window.electronAPI.getPathForFile(file);
    console.log('resolved path:', filePath);
  const result = await window.electronAPI.convertHeic(filePath);

  if (!result.success) {
    alert('Could not convert HEIC file: ' + result.error);
    return;
  }

  preview.src = `data:image/png;base64,${result.base64}`;
  preview.style.display = 'block';
  preview.onload = () => extractPalette(preview);

  } else {
    // existing flow for jpg/png/webp/gif/bmp etc.
    const objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.style.display = 'block';

    preview.onload = () => {
      extractPalette(preview);
      URL.revokeObjectURL(objectUrl);
    };
  }
});

function extractPalette(imgElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scale = 100 / imgElement.naturalWidth;
  canvas.width = 100;
  canvas.height = imgElement.naturalHeight * scale;

  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const colorCounts = new Map();
  const bucketSize = 32; // group similar colors together

  for (let i = 0; i < data.length; i += 4) {
    const r = Math.floor(data[i] / bucketSize) * bucketSize;
    const g = Math.floor(data[i + 1] / bucketSize) * bucketSize;
    const b = Math.floor(data[i + 2] / bucketSize) * bucketSize;
    const alpha = data[i + 3];

    if (alpha < 125) continue; // skip transparent pixels

    const key = `${r},${g},${b}`;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }

  const sorted = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  renderSwatches(sorted);
}

function renderSwatches(colorEntries) {
  swatchesContainer.innerHTML = '';

  colorEntries.forEach(([rgbKey]) => {
    const [r, g, b] = rgbKey.split(',').map(Number);
    const hex = rgbToHex(r, g, b);

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

    const label = document.createElement('span');
    label.textContent = hex;
    label.className = 'hex-label';
    swatch.appendChild(label);

    swatch.addEventListener('click', async () => {
      await navigator.clipboard.writeText(hex);
      label.textContent = 'copied!';
      setTimeout(() => { label.textContent = hex; }, 800);
    });

    swatchesContainer.appendChild(swatch);
  });
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}