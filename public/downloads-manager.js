// downloads-manager.js
(function(){
  let downloads = JSON.parse(localStorage.getItem('digiworldDownloads') || '[]');
  let products  = JSON.parse(localStorage.getItem('digiworldProducts')  || '[]');

  function renderDownloads() {
    const listEl = document.getElementById('downloads-list');
    const sumEl  = document.getElementById('downloads-summary');
    if (!listEl || !sumEl) return;

    if (!downloads.length) {
      listEl.innerHTML = '<p>No downloads available.</p>';
      sumEl.innerHTML  = '';
      return;
    }

    let html = downloads.map(d => {
      const p = products.find(p=>p.id===d.productId) || {name:{en:'Unknown'}};
      return `
        <div class="download-row">
          <div>${p.name.en}</div>
          <a href="${d.downloadUrl}" target="_blank">Download</a>
        </div>`;
    }).join('');
    listEl.innerHTML = html;
    sumEl.innerHTML  = `<p>Total Files: ${downloads.length}</p>`;
  }

  document.addEventListener('DOMContentLoaded', renderDownloads);
})();
