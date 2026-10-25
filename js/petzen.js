/**
 * Fasnet 2027 Salmendingen – Petzen Script
 * Handles story submission, live Speech-to-Text transcription,
 * voice note recording (MediaRecorder) with Google Drive fallback, and media uploads.
 */

(function () {
  'use strict';

  // Nach Bereitstellung des Google Apps Scripts die Web-App-URL hier einfügen:
  var GOOGLE_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxELTGl4SyNp4_lL8nh8qtUqb_johcHz5F8Iv8H_SHivRJpbfj2lSJE7iXi9J1mFSziyg/exec";

  var attachedFile = null;
  var attachedBase64 = null;

  // Voice recording & STT states
  var voiceBlob = null;
  var voiceFile = null;
  var voiceAudioUrl = null;
  var mediaStream = null;
  var mediaRecorder = null;
  var recordedChunks = [];
  var speechRecognition = null;
  var isRecording = false;
  var recordingTimerInterval = null;
  var recordingSeconds = 0;
  var recognizedFinal = '';
  var preExistingText = '';
  var recognitionErrorOccurred = false;
  var wasAudioPlaying = false;

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

    // Voice UI elements
    var voiceBtn = document.getElementById('btn-voice-record');
    var voiceBtnText = document.getElementById('voice-btn-text');
    var voiceRecordingPanel = document.getElementById('voice-recording-panel');
    var recordingTimer = document.getElementById('recording-timer');
    var voiceLiveHint = document.getElementById('voice-live-hint');
    var voiceStopBtn = document.getElementById('btn-voice-stop');
    var voiceCancelBtn = document.getElementById('btn-voice-cancel');

    // Voice Result elements
    var voiceResultCard = document.getElementById('voice-result-card');
    var voiceResultIcon = document.getElementById('voice-result-icon');
    var voiceResultTitle = document.getElementById('voice-result-title');
    var voiceResultStatus = document.getElementById('voice-result-status');
    var voiceResultDelete = document.getElementById('voice-result-delete');
    var playbackBtn = document.getElementById('btn-audio-playback');
    var progressWrap = document.getElementById('audio-progress-wrap');
    var progressBar = document.getElementById('audio-progress-bar');
    var playbackTime = document.getElementById('audio-playback-time');
    var voiceAudioElement = document.getElementById('voice-audio-element');
    var voiceDriveToggle = document.getElementById('voice-upload-drive-toggle');
    var voiceDriveToggleText = document.getElementById('voice-drive-toggle-text');

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      var kb = bytes / 1024;
      if (kb < 1024) return kb.toFixed(1) + ' KB';
      return (kb / 1024).toFixed(1) + ' MB';
    }

    function formatTime(seconds) {
      var mins = Math.floor(seconds / 60);
      var secs = Math.floor(seconds % 60);
      return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function getSupportedMimeType() {
      if (typeof MediaRecorder === 'undefined') return { mime: '', ext: 'webm' };
      var candidates = [
        { mime: 'audio/webm;codecs=opus', ext: 'webm' },
        { mime: 'audio/webm', ext: 'webm' },
        { mime: 'audio/mp4', ext: 'mp4' },
        { mime: 'audio/aac', ext: 'aac' },
        { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
        { mime: 'audio/wav', ext: 'wav' }
      ];
      for (var i = 0; i < candidates.length; i++) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidates[i].mime)) {
          return candidates[i];
        }
      }
      return { mime: '', ext: 'webm' };
    }

    // =========================================================================
    // File Handling
    // =========================================================================
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
      if (mediaBtnText) mediaBtnText.textContent = 'Foto / Video';
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

    // =========================================================================
    // Voice Recording & Speech-to-Text Logic
    // =========================================================================
    function updateTimerDisplay() {
      if (recordingTimer) {
        recordingTimer.textContent = formatTime(recordingSeconds);
      }
    }

    function startVoiceRecording() {
      if (isRecording) {
        stopVoiceRecording(false);
        return;
      }

      // Check browser getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Dein Browser unterstützt leider keine direkte Audioaufnahme per Mikrofon.');
        return;
      }

      // Pause site audio if currently playing
      if (window.fasnetPlayer && typeof window.fasnetPlayer.isPlaying === 'function' && window.fasnetPlayer.isPlaying()) {
        wasAudioPlaying = true;
        window.fasnetPlayer.pause();
      } else {
        wasAudioPlaying = false;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          mediaStream = stream;
          isRecording = true;
          recordedChunks = [];
          recognizedFinal = '';
          recognitionErrorOccurred = false;
          recordingSeconds = 0;
          preExistingText = storyInput ? storyInput.value.trim() : '';

          // UI update
          if (voiceBtn) {
            voiceBtn.classList.add('is-recording');
            if (voiceBtnText) voiceBtnText.textContent = 'Aufnahme stoppen';
          }
          if (voiceRecordingPanel) {
            voiceRecordingPanel.style.display = 'flex';
          }
          if (voiceResultCard) {
            voiceResultCard.style.display = 'none';
          }

          updateTimerDisplay();
          recordingTimerInterval = setInterval(function () {
            recordingSeconds++;
            updateTimerDisplay();
          }, 1000);

          // Setup MediaRecorder for capturing audio (fallback or drive storage)
          var mimeInfo = getSupportedMimeType();
          try {
            mediaRecorder = mimeInfo.mime ? new MediaRecorder(stream, { mimeType: mimeInfo.mime }) : new MediaRecorder(stream);
          } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
          }

          mediaRecorder.ondataavailable = function (e) {
            if (e.data && e.data.size > 0) {
              recordedChunks.push(e.data);
            }
          };

          mediaRecorder.start(250);

          // Setup SpeechRecognition (Web Speech API)
          var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRec) {
            try {
              speechRecognition = new SpeechRec();
              speechRecognition.lang = 'de-DE';
              speechRecognition.continuous = true;
              speechRecognition.interimResults = true;
              speechRecognition.maxAlternatives = 1;

              speechRecognition.onstart = function () {
                if (voiceLiveHint) {
                  voiceLiveHint.textContent = '🎙️ Höre zu... Sprich frei drauflos! (Wird live in Text umgewandelt)';
                }
              };

              speechRecognition.onresult = function (event) {
                var interimTranscript = '';
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                  var piece = event.results[i][0].transcript;
                  if (event.results[i].isFinal) {
                    recognizedFinal += piece + ' ';
                  } else {
                    interimTranscript += piece;
                  }
                }

                var fullOutput = (preExistingText ? preExistingText + ' ' : '') + recognizedFinal + interimTranscript;
                if (storyInput) {
                  storyInput.value = fullOutput.trim();
                }
              };

              speechRecognition.onerror = function (event) {
                console.warn('Speech recognition warning:', event.error);
                if (event.error !== 'no-speech') {
                  recognitionErrorOccurred = true;
                }
              };

              speechRecognition.onend = function () {
                // If user is still recording, resume recognition if browser stopped on pause
                if (isRecording && speechRecognition) {
                  try {
                    speechRecognition.start();
                  } catch (e) {}
                }
              };

              speechRecognition.start();
            } catch (srErr) {
              console.warn('Speech recognition could not start:', srErr);
              speechRecognition = null;
              if (voiceLiveHint) {
                voiceLiveHint.textContent = '🎙️ Sprachnachricht wird aufgezeichnet (wird direkt an dein Google Drive gesendet)...';
              }
            }
          } else {
            if (voiceLiveHint) {
              voiceLiveHint.textContent = '🎙️ Sprachnachricht wird aufgezeichnet (Audiodatei für Google Drive)...';
            }
          }
        })
        .catch(function (err) {
          console.error('Microphone access failed:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert('Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Mikrofonzugriff in deinen Browsereinstellungen.');
          } else {
            alert('Mikrofon konnte nicht aktiviert werden: ' + (err.message || err.name));
          }
        });
    }

    function stopVoiceRecording(canceled) {
      if (!isRecording) return;
      isRecording = false;

      if (recordingTimerInterval) {
        clearInterval(recordingTimerInterval);
        recordingTimerInterval = null;
      }

      if (voiceBtn) {
        voiceBtn.classList.remove('is-recording');
        if (voiceBtnText) voiceBtnText.textContent = 'Diktieren / Sprechen';
      }

      if (voiceRecordingPanel) {
        voiceRecordingPanel.style.display = 'none';
      }

      // Stop speech recognition
      if (speechRecognition) {
        speechRecognition.onend = null;
        try {
          speechRecognition.stop();
        } catch (e) {}
      }

      // Stop MediaRecorder
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.onstop = function () {
          if (!canceled) {
            processVoiceResult();
          }
        };
        try {
          mediaRecorder.stop();
        } catch (e) {}
      }

      // Release microphone tracks immediately
      if (mediaStream) {
        mediaStream.getTracks().forEach(function (track) {
          track.stop();
        });
        mediaStream = null;
      }

      // Restore original text if canceled
      if (canceled && storyInput && preExistingText !== undefined) {
        storyInput.value = preExistingText;
      }
    }

    function processVoiceResult() {
      var mimeInfo = getSupportedMimeType();
      var finalMime = (recordedChunks[0] && recordedChunks[0].type) || mimeInfo.mime || 'audio/webm';
      voiceBlob = new Blob(recordedChunks, { type: finalMime });

      if (voiceBlob.size === 0) {
        console.warn('Recorded audio was empty.');
        return;
      }

      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var d = new Date();
      var timeStampStr = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
      var ext = mimeInfo.ext || 'webm';
      var fileName = 'sprachnachricht_' + timeStampStr + '.' + ext;

      try {
        voiceFile = new File([voiceBlob], fileName, { type: finalMime });
      } catch (e) {
        voiceBlob.name = fileName;
        voiceFile = voiceBlob;
      }

      // Prepare audio playback element
      if (voiceAudioUrl) {
        URL.revokeObjectURL(voiceAudioUrl);
      }
      voiceAudioUrl = URL.createObjectURL(voiceBlob);
      if (voiceAudioElement) {
        voiceAudioElement.src = voiceAudioUrl;
        voiceAudioElement.load();
      }
      if (playbackTime) {
        playbackTime.textContent = formatTime(recordingSeconds);
      }

      // =========================================================================
      // Decision Logic: Confidence in parsing Speech to Text vs. Google Drive Audio
      // "if you are confident you can parse the speech to text before sending. Else one can just send the voice note to my google drive."
      // =========================================================================
      var hasWebSpeechSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      var textFromSpeech = recognizedFinal.trim();
      var isConfident = hasWebSpeechSupport && textFromSpeech.length > 2 && !recognitionErrorOccurred;

      if (isConfident) {
        // Confident STT: The speech was parsed live into the textarea
        if (voiceResultCard) {
          voiceResultCard.className = 'voice-result-card success-stt';
          voiceResultCard.style.display = 'flex';
        }
        if (voiceResultIcon) voiceResultIcon.textContent = '✨';
        if (voiceResultTitle) voiceResultTitle.textContent = 'Sprache erfolgreich in Text umgewandelt!';
        if (voiceResultStatus) {
          voiceResultStatus.textContent = 'Dein Text steht oben im Eingabefeld. Du kannst ihn dort frei anpassen.';
        }
        if (voiceDriveToggle) {
          voiceDriveToggle.checked = true;
          voiceDriveToggle.disabled = false;
        }
        if (voiceDriveToggleText) {
          voiceDriveToggleText.textContent = '☁️ Original-Sprachnachricht auch im Google Drive speichern';
        }

        // Sync file attachment based on toggle
        syncVoiceAttachmentWithToggle();

      } else {
        // Not confident, speech recognition not supported (e.g. Firefox), or no clear speech recognized:
        // Automatically send voice note to Google Drive!
        if (voiceResultCard) {
          voiceResultCard.className = 'voice-result-card fallback-drive';
          voiceResultCard.style.display = 'flex';
        }
        if (voiceResultIcon) voiceResultIcon.textContent = '🎙️';
        if (voiceResultTitle) voiceResultTitle.textContent = 'Sprachnachricht aufgenommen';
        if (voiceResultStatus) {
          voiceResultStatus.textContent = 'Wird als Audiodatei direkt in dein Google Drive übertragen.';
        }
        if (voiceDriveToggle) {
          voiceDriveToggle.checked = true;
          voiceDriveToggle.disabled = true; // Required since speech wasn't converted to text
        }
        if (voiceDriveToggleText) {
          voiceDriveToggleText.textContent = '☁️ Wird als Sprachnachricht direkt in dein Google Drive übertragen';
        }

        // Attach voice note directly to form upload
        attachVoiceNote();

        // If story textarea is empty or still has only the pre-existing text, provide a clean note
        if (storyInput && (!storyInput.value.trim() || storyInput.value.trim() === preExistingText)) {
          var timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          storyInput.value = (preExistingText ? preExistingText + '\n\n' : '') + '🎙️ Sprachnachricht aufgenommen (' + timeStr + ' Uhr)';
        }

        // Remove required attribute so form submission doesn't block if only audio is sent
        if (storyInput) {
          storyInput.removeAttribute('required');
        }
      }
    }

    function attachVoiceNote() {
      if (!voiceFile) return;
      attachedFile = voiceFile;

      if (fileNameSpan) {
        fileNameSpan.textContent = voiceFile.name + ' (' + formatBytes(voiceFile.size) + ')';
      }
      if (filePill) {
        filePill.style.display = 'inline-flex';
      }
      if (mediaBtnText) {
        mediaBtnText.textContent = 'Sprachnachricht ersetzen';
      }
      if (mediaPickerLabel) {
        mediaPickerLabel.classList.add('has-file');
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        attachedBase64 = e.target.result.split(',')[1];
      };
      reader.readAsDataURL(voiceFile);
    }

    function syncVoiceAttachmentWithToggle() {
      if (voiceDriveToggle && voiceDriveToggle.checked) {
        attachVoiceNote();
      } else {
        if (attachedFile === voiceFile) {
          clearFile();
        }
      }
    }

    if (voiceDriveToggle) {
      voiceDriveToggle.addEventListener('change', syncVoiceAttachmentWithToggle);
    }

    // Voice Action Buttons
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isRecording) {
          stopVoiceRecording(false);
        } else {
          startVoiceRecording();
        }
      });
    }

    if (voiceStopBtn) {
      voiceStopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        stopVoiceRecording(false);
      });
    }

    if (voiceCancelBtn) {
      voiceCancelBtn.addEventListener('click', function (e) {
        e.preventDefault();
        stopVoiceRecording(true);
      });
    }

    // Audio Playback Preview
    if (playbackBtn && voiceAudioElement) {
      playbackBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (voiceAudioElement.paused) {
          voiceAudioElement.play().then(function () {
            playbackBtn.textContent = '⏸';
          }).catch(function (err) {
            console.log('Voice audio playback error:', err);
          });
        } else {
          voiceAudioElement.pause();
          playbackBtn.textContent = '▶';
        }
      });

      voiceAudioElement.addEventListener('timeupdate', function () {
        if (!voiceAudioElement.duration || isNaN(voiceAudioElement.duration)) return;
        var progress = (voiceAudioElement.currentTime / voiceAudioElement.duration) * 100;
        if (progressBar) progressBar.style.width = progress + '%';
        if (playbackTime) {
          playbackTime.textContent = formatTime(voiceAudioElement.currentTime) + ' / ' + formatTime(voiceAudioElement.duration);
        }
      });

      voiceAudioElement.addEventListener('loadedmetadata', function () {
        if (playbackTime && voiceAudioElement.duration) {
          playbackTime.textContent = '00:00 / ' + formatTime(voiceAudioElement.duration);
        }
      });

      voiceAudioElement.addEventListener('ended', function () {
        playbackBtn.textContent = '▶';
        if (progressBar) progressBar.style.width = '0%';
        if (playbackTime && voiceAudioElement.duration) {
          playbackTime.textContent = formatTime(voiceAudioElement.duration);
        }
      });

      if (progressWrap) {
        progressWrap.addEventListener('click', function (e) {
          if (!voiceAudioElement.duration) return;
          var rect = progressWrap.getBoundingClientRect();
          var clickPos = (e.clientX - rect.left) / rect.width;
          voiceAudioElement.currentTime = clickPos * voiceAudioElement.duration;
        });
      }
    }

    // Delete Voice Note
    if (voiceResultDelete) {
      voiceResultDelete.addEventListener('click', function (e) {
        e.preventDefault();
        if (voiceAudioElement) {
          voiceAudioElement.pause();
          voiceAudioElement.src = '';
        }
        if (voiceAudioUrl) {
          URL.revokeObjectURL(voiceAudioUrl);
          voiceAudioUrl = null;
        }
        if (attachedFile === voiceFile) {
          clearFile();
        }
        voiceBlob = null;
        voiceFile = null;
        if (voiceResultCard) {
          voiceResultCard.style.display = 'none';
        }

        // Re-enable required attribute on textarea
        if (storyInput) {
          storyInput.setAttribute('required', 'required');
          if (storyInput.value.indexOf('🎙️ Sprachnachricht aufgenommen') !== -1) {
            storyInput.value = storyInput.value.replace(/🎙️ Sprachnachricht aufgenommen.*$/m, '').trim();
          }
        }
      });
    }

    // =========================================================================
    // Form Submission
    // =========================================================================
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var story = storyInput ? storyInput.value.trim() : '';

      // Fallback: If only an audio voice note was attached without extra text
      if (!story && attachedFile) {
        story = '🎙️ Sprachnachricht eingereicht (' + attachedFile.name + ')';
      }

      if (!story && !attachedFile) {
        alert('Bitte schreib kurz, was passiert ist oder sprich eine Sprachnachricht ein!');
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
            'Story / Sprachnachricht erfasst! (Demo-Modus)',
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
            'Vergelt\'s Gott! Deine Geschichte und Mediendaten sind sicher und 100% anonym im Narrenkasten des Elferrats Salmendingen gelandet.'
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

      if (voiceAudioElement) {
        voiceAudioElement.pause();
        voiceAudioElement.src = '';
      }
      if (voiceAudioUrl) {
        URL.revokeObjectURL(voiceAudioUrl);
        voiceAudioUrl = null;
      }
      voiceBlob = null;
      voiceFile = null;

      if (voiceResultCard) voiceResultCard.style.display = 'none';
      if (voiceRecordingPanel) voiceRecordingPanel.style.display = 'none';

      if (storyInput) {
        storyInput.setAttribute('required', 'required');
      }

      form.style.display = 'block';
      if (statusMessage) statusMessage.style.display = 'none';
      if (storyInput) storyInput.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', initPetzen);
})();
