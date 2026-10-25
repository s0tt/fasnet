/**
 * Fasnet 2027 Salmendingen – Audio Player
 * Plays authentic Elferrat Salmendingen hits with interactive floating controls
 * Autoplays Geilste Galaxie first, followed by Abrissparty
 */

(function () {
  'use strict';

  var playlist = [
    {
      title: 'Geilste Galaxie',
      artist: 'Elferrat Salmendingen',
      file: './assets/audio/geilste_galaxie.mp3'
    },
    {
      title: 'Abrissparty',
      artist: 'Elferrat Salmendingen',
      file: './assets/audio/abrissparty.mp3'
    },
    {
      title: 'Bella Salmendingen',
      artist: 'Elferrat Salmendingen',
      file: './assets/audio/bella_salmendingen.mp3'
    },
    {
      title: 'Post geht ab',
      artist: 'Elferrat Salmendingen',
      file: './assets/audio/post_geht_ab.mp3'
    },
    {
      title: 'Fasnet Fieber',
      artist: 'Elferrat Salmendingen',
      file: './assets/audio/fasnet_fieber.mp3'
    }
  ];

  var currentIndex = 0;
  var audio = null;

  function getAudio() {
    if (!audio) {
      audio = document.getElementById('site-audio');
      if (!audio) {
        audio = new Audio();
      }
      audio.preload = 'auto';
      audio.src = playlist[currentIndex].file;
    }
    return audio;
  }

  function initPlayer() {
    var playerBar = document.getElementById('audio-player-bar');
    if (!playerBar) return;

    var playerAudio = getAudio();
    var playBtn = document.getElementById('player-play-btn');
    var prevBtn = document.getElementById('player-prev-btn');
    var nextBtn = document.getElementById('player-next-btn');
    var titleEl = document.getElementById('player-title');
    var artistEl = document.getElementById('player-artist');
    var minimizeBtn = document.getElementById('player-minimize-btn');

    function updateTrackUI() {
      var track = playlist[currentIndex];
      if (titleEl) titleEl.textContent = track.title;
      if (artistEl) artistEl.textContent = track.artist;
      if (playerAudio.src !== track.file && !playerAudio.src.endsWith(track.file.replace('./', ''))) {
        playerAudio.src = track.file;
      }
    }

    function setPlayingState(isPlaying) {
      if (isPlaying) {
        playerBar.classList.add('playing');
        playerBar.classList.remove('pending-activation');
        if (playBtn) {
          playBtn.innerHTML = '⏸';
          playBtn.setAttribute('title', 'Pause');
          playBtn.setAttribute('aria-label', 'Pause');
        }
      } else {
        playerBar.classList.remove('playing');
        if (playBtn) {
          playBtn.innerHTML = '▶';
          playBtn.setAttribute('title', 'Abspielen');
          playBtn.setAttribute('aria-label', 'Abspielen');
        }
      }
    }

    function togglePlay() {
      if (playerAudio.paused) {
        playerAudio.play().then(function () {
          setPlayingState(true);
        }).catch(function (err) {
          console.log('Play failed:', err);
        });
      } else {
        playerAudio.pause();
        setPlayingState(false);
      }
    }

    function playNext() {
      currentIndex = (currentIndex + 1) % playlist.length;
      updateTrackUI();
      playerAudio.play().then(function () {
        setPlayingState(true);
      }).catch(function () {
        setPlayingState(false);
      });
    }

    function playPrev() {
      currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      updateTrackUI();
      playerAudio.play().then(function () {
        setPlayingState(true);
      }).catch(function () {
        setPlayingState(false);
      });
    }

    // Set initial track
    updateTrackUI();

    // Event Listeners for Player Buttons
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    if (prevBtn) prevBtn.addEventListener('click', playPrev);

    // Auto-advance to next track on end (Geilste Galaxie -> Abrissparty -> ...)
    playerAudio.addEventListener('ended', function () {
      playNext();
    });

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', function () {
        playerBar.classList.toggle('minimized');
        var isMin = playerBar.classList.contains('minimized');
        minimizeBtn.textContent = isMin ? '⤢' : '—';
      });
    }

    // Connect header triggers
    var headerMusicTriggers = document.querySelectorAll('[data-action="toggle-music"]');
    headerMusicTriggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        togglePlay();
      });
    });

    // =========================================================================
    // Robust Autoplay Implementation:
    // 1. Attempt immediate playback.
    // 2. If blocked by browser user-gesture policy without interaction:
    //    Listen on genuine user gesture events ('pointerdown', 'mousedown', 'touchstart', 'click', 'keydown')
    //    across the entire document.
    // 3. Remove listeners ONLY once playback has successfully started!
    // =========================================================================
    var gestureEvents = ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'];
    var listenersAttached = false;

    function cleanupGestureListeners() {
      if (!listenersAttached) return;
      listenersAttached = false;
      gestureEvents.forEach(function (evt) {
        document.removeEventListener(evt, onUserGesture, { capture: true });
      });
    }

    function attemptPlayback() {
      var promise = playerAudio.play();
      if (promise !== undefined) {
        promise.then(function () {
          setPlayingState(true);
          cleanupGestureListeners();
          sessionStorage.setItem('fasnet_music_active', 'true');
        }).catch(function () {
          // Autoplay was blocked without user gesture.
          playerBar.classList.add('pending-activation');
          attachGestureListeners();
        });
      }
    }

    function onUserGesture() {
      attemptPlayback();
    }

    function attachGestureListeners() {
      if (listenersAttached) return;
      listenersAttached = true;
      gestureEvents.forEach(function (evt) {
        document.addEventListener(evt, onUserGesture, { capture: true, passive: true });
      });
    }

    // Autoplay policy: Only autoplay on the main page (index.html / root), NOT on the petzen site
    var isPetzenPage = window.location.pathname.indexOf('petzen') !== -1 || !!document.querySelector('.petzen-page');
    if (!isPetzenPage) {
      // Attempt playback immediately
      attemptPlayback();

      // Also attempt on window load
      window.addEventListener('load', function () {
        if (playerAudio.paused) {
          attemptPlayback();
        }
      });
    }

    // Expose global helper
    window.fasnetPlayer = {
      play: function () {
        playerAudio.play().then(function () {
          setPlayingState(true);
        }).catch(function () {});
      },
      pause: function () {
        playerAudio.pause();
        setPlayingState(false);
      },
      isPlaying: function () {
        return !playerAudio.paused;
      },
      toggle: togglePlay
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer);
  } else {
    initPlayer();
  }
})();
