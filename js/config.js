/**
 * Fasnet 2027 Salmendingen – Configuration File
 * 
 * In a public GitHub repository, this file contains safe placeholders.
 * When deployed via GitHub Pages & GitHub Actions, GitHub Repository Secrets
 * (__DEEPGRAM_API_KEY__ and __GOOGLE_SCRIPT_WEBAPP_URL__) are injected into the build artifact.
 * 
 * For local development:
 * Create 'js/config.local.js' (excluded by .gitignore) to test locally without committing keys to Git.
 */

(function () {
  'use strict';

  window.FASNET_CONFIG = {
    DEEPGRAM_API_KEY: '__DEEPGRAM_API_KEY__',
    GOOGLE_SCRIPT_WEBAPP_URL: '__GOOGLE_SCRIPT_WEBAPP_URL__'
  };
})();
