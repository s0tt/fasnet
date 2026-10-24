/**
 * Fasnet 2027 Salmendingen – Petzen Script (Simplified)
 * Handles single story field, media picker button, and anonymous submission
 */

(function () {
  'use strict';

  // Nach Bereitstellung des Google Apps Scripts die Web-App-URL hier einfügen:
  var GOOGLE_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxELTGl4SyNp4_lL8nh8qtUqb_johcHz5F8Iv8H_SHivRJpbfj2lSJE7iXi9J1mFSziyg/exec";

  var attachedFile = null;
  var attachedBase64 = null;

  function initPetzen() {
    var form = document.getElementById('petzen-form');
    if (!form) return;

    var storyInput = document.getElementById('petzen-story');
    var fileInput = document.getElementById('file-input');
    var mediaBtnText = document.getElementById('media-btn-text');
    var mediaPickerLabel = document.getElementById('media-picker-label');
    var filePill = document.getElementById('file-chosen-pill');
    var fileNameSpan = document.getElementById('file-chosen-name');
    var removeFileBtn = document.getElementById('file-remove-btn');
    var submitBtn = document.getElementById('btn-submit-petzen');
    var submitText = document.getElementById('btn-submit-text');
    var submitSpinner = document.getElementById('btn-submit-spinner');
    var statusMessage = document.getElementById('status-message');

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      var kb = bytes / 1024;
      if (kb < 1024) return kb.toFixed(1) + ' KB';
      return (kb / 1024).toFixed(1) + ' MB';
    }

    function handleFileSelect(file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('Die ausgewählte Datei ist zu groß (max. 25 MB). Bitte wähle eine kleinere Datei.');
        return;
      }

      attachedFile = file;

      if (fileNameSpan) {
        fileNameSpan.textContent = file.name + ' (' + formatBytes(file.size) + ')';
      }
      if (filePill) {
        filePill.style.display = 'inline-flex';
      }
      if (mediaBtnText) {
        mediaBtnText.textContent = 'Datei ändern';
      }
      if (mediaPickerLabel) {
        mediaPickerLabel.classList.add('has-file');
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        attachedBase64 = e.target.result.split(',')[1];
      };
      reader.readAsDataURL(file);
    }

    function clearFile() {
      attachedFile = null;
      attachedBase64 = null;
      if (fileInput) fileInput.value = '';
      if (filePill) filePill.style.display = 'none';
      if (mediaBtnText) mediaBtnText.textContent = 'Foto / Video hinzufügen';
      if (mediaPickerLabel) mediaPickerLabel.classList.remove('has-file');
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length > 0) {
          handleFileSelect(fileInput.files[0]);
        }
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        clearFile();
      });
    }

    // Form Submission
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var story = storyInput ? storyInput.value.trim() : '';
      if (!story) {
        alert('Bitte schreib kurz, was passiert ist!');
        if (storyInput) storyInput.focus();
        return;
      }

      // Generate a short title from the first sentence or words
      var autoTitle = story.split('\n')[0].slice(0, 45).trim();
      if (story.length > 45) autoTitle += '...';

      // UI Loading state
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Wird gepetzt...';
      if (submitSpinner) submitSpinner.style.display = 'inline-block';
      if (statusMessage) {
        statusMessage.className = 'status-message';
        statusMessage.style.display = 'none';
      }

      var payload = {
        title: autoTitle || 'Anonyme Petz-Story',
        story: story,
        timestamp: new Date().toISOString(),
        fileName: attachedFile ? attachedFile.name : '',
        fileType: attachedFile ? attachedFile.type : '',
        fileData: attachedBase64 || ''
      };

      if (!GOOGLE_SCRIPT_WEBAPP_URL || GOOGLE_SCRIPT_WEBAPP_URL === "") {
        setTimeout(function () {
          showSuccess(
            'Story erfolgreich erfasst! (Demo-Modus)',
            'Vergelt\'s Gott! Deine Geschichte wurde erfasst. Sobald deine Google Apps Script URL hinterlegt ist, wandert alles direkt in dein Google Sheet & Drive!'
          );
        }, 1000);
        return;
      }

      fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function () {
          showSuccess(
            'Erfolgreich gepetzt!',
            'Vergelt\'s Gott! Deine Geschichte ist sicher und 100% anonym im Narrenkasten des Elferrats Salmendingen gelandet.'
          );
        })
        .catch(function (error) {
          console.error('Submission error:', error);
          showError('Es gab leider einen Übertragungsfehler. Bitte versuche es später noch einmal.');
        });
    });

    function showSuccess(title, text) {
      submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Petzen 🤫';
      if (submitSpinner) submitSpinner.style.display = 'none';

      if (window.confetti) {
        window.confetti.festiveRain();
        setTimeout(function () { window.confetti.burst(); }, 300);
      }

      form.style.display = 'none';

      if (statusMessage) {
        statusMessage.className = 'status-message success';
        statusMessage.innerHTML = (
          '<div class="success-icon">🎭</div>' +
          '<h3 class="success-title">' + title + '</h3>' +
          '<p>' + text + '</p>' +
          '<button type="button" class="btn-reset-form" id="btn-reset-form-inner">Noch eine Geschichte petzen</button>'
        );
        statusMessage.style.display = 'block';

        var innerReset = document.getElementById('btn-reset-form-inner');
        if (innerReset) {
          innerReset.addEventListener('click', resetForm);
        }
      }
    }

    function showError(msg) {
      submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Petzen 🤫';
      if (submitSpinner) submitSpinner.style.display = 'none';

      if (statusMessage) {
        statusMessage.className = 'status-message error';
        statusMessage.innerHTML = '<p>' + msg + '</p>';
        statusMessage.style.display = 'block';
      }
    }

    function resetForm() {
      form.reset();
      clearFile();
      form.style.display = 'block';
      if (statusMessage) statusMessage.style.display = 'none';
      if (storyInput) storyInput.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', initPetzen);
})();
