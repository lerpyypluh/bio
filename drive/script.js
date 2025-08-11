// drive/script.js
(async function(){
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');
  const searchEl = document.getElementById('search');
  const previewModal = document.getElementById('previewModal');
  const previewContent = document.getElementById('previewContent');
  const closePreview = document.getElementById('closePreview');
  const downloadBtn = document.getElementById('downloadBtn');
  const openNewTab = document.getElementById('openNewTab');

  // Load manifest (index.json) placed in /drive/index.json
  let manifest;
  try {
    const res = await fetch('index.json', {cache: 'no-store'});
    if(!res.ok) throw new Error('Manifest not found');
    manifest = await res.json();
  } catch (err) {
    listEl.innerHTML = '<div class="empty">No index.json found in /drive — add one or run generator.</div>';
    console.error(err);
    return;
  }

  // Normalize entries (ensure url path)
  const entries = (manifest.files || []).map(f => {
    return Object.assign({
      name: f.name,
      path: f.path || encodeURI(f.name),
      size: f.size || 0,
      mtime: f.mtime || null
    }, f);
  });

  // Utility: pretty size
  function formatSize(n){
    if(!n && n !== 0) return '';
    if(n < 1024) return `${n} B`;
    if(n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
    if(n < 1024*1024*1024) return `${(n/1024/1024).toFixed(1)} MB`;
    return `${(n/1024/1024/1024).toFixed(2)} GB`;
  }

  // Icon by extension
  function extIcon(name){
    const ext = (name.split('.').pop() || '').toLowerCase();
    if(/png|jpg|jpeg|gif|webp|bmp|svg/.test(ext)) return '🖼️';
    if(/mp4|webm|ogg|mov|mkv/.test(ext)) return '🎬';
    if(/mp3|wav|flac|m4a/.test(ext)) return '🎵';
    if(/pdf/.test(ext)) return '📄';
    if(/zip|rar|7z|tar|gz/.test(ext)) return '🗜️';
    if(/txt|md|json|js|css|html|py|java|c|cpp/.test(ext)) return '📄';
    return '📁';
  }

  // Render list
  function render(items){
    listEl.innerHTML = '';
    if(!items.length){ emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';
    items.forEach(file => {
      const it = document.createElement('div');
      it.className = 'item';
      it.innerHTML = `
        <div class="row">
          <div class="thumb">${extIcon(file.name)}</div>
          <div class="info">
            <div class="name" title="${file.name}">${file.name}</div>
            <div class="meta">${file.mtime ? new Date(file.mtime).toLocaleString() : ''} · ${formatSize(file.size)}</div>
          </div>
          <div class="actions">
            <button class="btn preview-btn">Preview</button>
            <a class="btn" href="${file.path}" download>Download</a>
          </div>
        </div>
      `;
      // Preview handling
      it.querySelector('.preview-btn').addEventListener('click', ()=> openPreview(file));
      listEl.appendChild(it);
    });
  }

  // Search
  searchEl.addEventListener('input', e => {
    const q = (e.target.value || '').trim().toLowerCase();
    const filtered = entries.filter(f => f.name.toLowerCase().includes(q) || (f.tags || []).join(' ').toLowerCase().includes(q));
    render(filtered);
  });

  // Preview logic
  async function openPreview(file){
    previewContent.innerHTML = '';
    previewModal.setAttribute('aria-hidden','false');

    // download/open controls
    const url = file.path;
    downloadBtn.href = url;
    downloadBtn.setAttribute('download', file.name);
    openNewTab.onclick = ()=> window.open(url, '_blank');

    const nameLower = file.name.toLowerCase();
    // images
    if(/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(nameLower)){
      const img = document.createElement('img');
      img.src = url;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '70vh';
      previewContent.appendChild(img);
      return;
    }
    // audio
    if(/\.(mp3|wav|ogg|m4a|flac)$/i.test(nameLower)){
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = url;
      audio.style.width = '100%';
      previewContent.appendChild(audio);
      return;
    }
    // video
    if(/\.(mp4|webm|ogg|mov)$/i.test(nameLower)){
      const video = document.createElement('video');
      video.controls = true;
      video.src = url;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '70vh';
      previewContent.appendChild(video);
      return;
    }
    // pdf
    if(/\.pdf$/i.test(nameLower)){
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '70vh';
      iframe.style.border = 'none';
      previewContent.appendChild(iframe);
      return;
    }
    // text / code
    if(/\.txt$|\.md$|\.json$|\.js$|\.css$|\.html$|\.py$|\.java$|\.c$|\.cpp$/i.test(nameLower)){
      try {
        const resp = await fetch(url);
        const text = await resp.text();
        const pre = document.createElement('pre');
        pre.textContent = text;
        pre.style.maxHeight = '70vh';
        pre.style.overflow = 'auto';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        previewContent.appendChild(pre);
      } catch (e) {
        previewContent.innerText = 'Could not load file preview.';
      }
      return;
    }

    // fallback: try to embed
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.style.width = '100%';
    frame.style.height = '70vh';
    frame.style.border = 'none';
    previewContent.appendChild(frame);
  }

  closePreview.addEventListener('click', ()=> previewModal.setAttribute('aria-hidden','true'));

  // initial render
  render(entries);
})();
