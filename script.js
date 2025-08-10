// === SOCIAL LINKS ===
const linksData = [
  { icon: '🐦', url: document.body.dataset.twitter },
  { icon: '📸', url: document.body.dataset.instagram },
  { icon: '💻', url: document.body.dataset.github }
];

const linksContainer = document.getElementById('links');
linksData.forEach(link => {
  if (link.url) {
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.icon;
    a.target = "_blank";
    a.rel = "noopener";
    a.classList.add('neon-btn');
    linksContainer.appendChild(a);
  }
});

// === TYPEWRITER EFFECT ===
function typeWriter(element, text, delay = 80) {
  element.textContent = '';
  let i = 0;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, delay);
    }
  }
  type();
}

window.addEventListener('load', () => {
  const nameEl = document.getElementById('name');
  const taglineEl = document.getElementById('tagline');
  typeWriter(nameEl, document.body.dataset.name, 100);
  setTimeout(() => typeWriter(taglineEl, document.body.dataset.tagline, 60), 1200);
});

// === MUSIC TOGGLE ===
const music = document.getElementById('bgMusic');
const playPauseBtn = document.getElementById('playPause');
let playing = false;

playPauseBtn.addEventListener('click', () => {
  if (!playing) {
    music.play();
    playing = true;
    playPauseBtn.textContent = '⏸';
  } else {
    music.pause();
    playing = false;
    playPauseBtn.textContent = '⏵';
  }
});

// === WAVEFORM VISUALIZER ===
const visualizerCanvas = document.getElementById('visualizer-canvas');
const ctx = visualizerCanvas.getContext('2d');

function resizeVisualizer() {
  visualizerCanvas.width = window.innerWidth;
  visualizerCanvas.height = 150;
}
resizeVisualizer();
window.addEventListener('resize', resizeVisualizer);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let source;
let dataArray;

function connectAudio() {
  if (!source) {
    source = audioCtx.createMediaElementSource(music);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
}

// Draw waveform
function drawWaveform() {
  requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);

  ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#0ff';

  ctx.beginPath();
  const sliceWidth = visualizerCanvas.width / dataArray.length;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * visualizerCanvas.height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  ctx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
  ctx.stroke();
}

music.addEventListener('play', () => {
  audioCtx.resume();
  connectAudio();
  drawWaveform();
});
