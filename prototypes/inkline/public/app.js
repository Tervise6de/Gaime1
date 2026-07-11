'use strict';

// Drag & drop upload affordance (home page).
(function () {
  var dz = document.getElementById('dropzone');
  var input = document.getElementById('file-input');
  var nameEl = document.getElementById('dz-filename');
  if (!dz || !input) return;

  function showName() {
    if (nameEl) nameEl.textContent = input.files.length ? input.files[0].name : '';
  }
  input.addEventListener('change', showName);

  ['dragenter', 'dragover'].forEach(function (evt) {
    dz.addEventListener(evt, function (e) {
      e.preventDefault();
      dz.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(function (evt) {
    dz.addEventListener(evt, function (e) {
      e.preventDefault();
      dz.classList.remove('dragover');
    });
  });
  dz.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      showName();
    }
  });
})();

// Share link (artifact page): fill with the canonical URL and wire up copy.
(function () {
  var urlInput = document.getElementById('share-url');
  var copyBtn = document.getElementById('copy-link');
  if (!urlInput) return;
  urlInput.value = window.location.origin + window.location.pathname;
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      urlInput.select();
      var done = function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(urlInput.value).then(done, function () {
          document.execCommand('copy');
          done();
        });
      } else {
        document.execCommand('copy');
        done();
      }
    });
  }
})();
