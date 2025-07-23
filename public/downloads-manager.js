document.addEventListener('DOMContentLoaded', () => {
  const downloadsList = document.getElementById('downloads-list');
  const downloadsSummary = document.getElementById('downloads-summary');

  const downloads = JSON.parse(localStorage.getItem('digiworldDownloads')) || [];
  const products = JSON.parse(localStorage.getItem('digiworldProducts')) || [];

  function renderDownloads() {
    if (!downloadsList || !downloadsSummary) return;

    if (downloads.length === 0) {
      downloadsList.innerHTML = '<p>No downloads found.</p>';
      downloadsSummary.innerHTML = '';
      return;
    }

    downloadsList.innerHTML = '';
    downloads.forEach(d => {
      const product = products.find(p => p.id === d.productId);
      if (!product) return;

      const row = document.createElement('div');
      row.className = 'download-row';
      row.innerHTML = `
        <div class="download-name">${product.name?.en || 'Unknown Product'}</div>
        <a href="${d.fileUrl}" class="download-link" target="_blank" rel="noopener">Download</a>
      `;
      downloadsList.appendChild(row);
    });

    downloadsSummary.innerHTML = `<strong>Total Downloads: ${downloads.length}</strong>`;
  }

  renderDownloads();
});
