(async function(){
  const list = document.getElementById('list'),
        empty = document.getElementById('empty'),
        search = document.getElementById('search'),
        modal = document.getElementById('modal'),
        preview = document.getElementById('preview'),
        closeBtn = document.getElementById('close'),
        download = document.getElementById('download'),
        openBtn = document.getElementById('open');

  const owner = 'infernopluh', repo = 'bio', folder = 'drive';
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;

  let files = [];
  try {
    const res = await fetch(api);
    const json = await res.json();
    files = json.filter(f => f.type === 'file').map(f => ({
      name: f.name,
      url: f.download_url,
      ext: f.name.split('.').pop().toLowerCase(),
      size: f.size,
      mtime: f.last_modified || ''
    }));
  } catch (e) {
    empty.textContent = 'Error loading files.';
    console.error(e);
    return;
  }

  function extIcon(ext){
    if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return '🖼';
    if (['mp4','webm','mov'].includes(ext)) return '🎬';
    if (['mp3','wav','ogg'].includes(ext)) return '🎵';
    if (ext === 'pdf') return '📄';
    if (['txt','md','json','js','css','html'].includes(ext)) return '📜';
    return '📁';
  }

  function render(listItems){
    list.innerHTML = '';
    if (!listItems.length){
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    listItems.forEach(f => {
      const item = document.createElement('div'); item.className = 'item';
      item.innerHTML = `
        <div class="row">
          <div class="thumb">${extIcon(f.ext)}</div>
          <div>
            <div class="name">${f.name}</div>
            <div class="meta">${f.size} bytes</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn preview">Open</button>
          <a class="btn primary" href="${f.url}" download>Download</a>
        </div>`;
      item.querySelector('.preview').onclick = ()=>openPreview(f);
      list.appendChild(item);
    });
  }

  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    render(files.filter(f => f.name.toLowerCase().includes(q)));
  };

  async function openPreview(f){
    preview.innerHTML = '';
    modal.setAttribute('aria-hidden','false');
    download.href = f.url;
    download.download = f.name;
    openBtn.onclick = () => window.open(f.url, '_blank');

    const e = f.ext;
    if (['png','jpg','jpeg','gif','webp','svg'].includes(e)){
      const img = document.createElement('img');
      img.src = f.url;
      img.style.maxWidth = '100%';
      preview.appendChild(img);
    } else if (['mp3','wav','ogg'].includes(e)){
      const audio = document.createElement('audio');
      audio.src = f.url; audio.controls = true;
      preview.appendChild(audio);
    } else if (['mp4','webm','mov'].includes(e)){
      const vid = document.createElement('video');
      vid.src = f.url; vid.controls = true; vid.style.maxWidth = '100%';
      preview.appendChild(vid);
    } else if (e === 'pdf'){
      const iframe = document.createElement('iframe');
      iframe.src = f.url; iframe.style.width = '100%'; iframe.style.height = '80vh';
      preview.appendChild(iframe);
    } else {
      try {
        const text = await (await fetch(f.url)).text();
        const pre = document.createElement('pre');
        pre.textContent = text;
        pre.style.maxHeight = '80vh';
        pre.style.overflow = 'auto';
        preview.appendChild(pre);
      } catch {
        preview.textContent = 'Cannot preview this file.';
      }
    }
  }

  closeBtn.onclick = () => modal.setAttribute('aria-hidden','true');
  render(files);
})();
