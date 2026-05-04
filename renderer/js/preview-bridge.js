/**
 * preview-bridge.js
 * Logic running inside the Live Preview Window.
 */
(function() {
  const mdContent = document.getElementById('md-content');
  const wrapper   = document.getElementById('preview-content-wrapper');
  const filename  = document.getElementById('filename-display');

  // Listen for updates
  if (window.electronAPI) {
    window.electronAPI.onPreviewUpdate((data) => updateUI(data));
    window.electronAPI.onPreviewScroll((data) => syncScroll(data));
    window.electronAPI.onThemeUpdate((data) => applyTheme(data));
  } else {
    // Web Fallback: postMessage
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data.type === 'preview-update') updateUI(data);
      if (data.type === 'preview-scroll') syncScroll(data);
      if (data.type === 'theme-update') applyTheme(data.settings);
    });
  }

  function applyTheme(settings) {
    if (!settings) return;
    const root = document.documentElement;
    
    // 1. CSS Variables
    if (settings.accentColor) root.style.setProperty('--accent-color', settings.accentColor);
    if (settings.fontText) root.style.setProperty('--font-text', settings.fontText);
    if (settings.fontCode) root.style.setProperty('--font-code', settings.fontCode);
    
    // 2. Background Layer
    const bgLayer = document.getElementById('app-background');
    if (bgLayer) {
      const enabled = settings.bgEnabled === true || settings.bgEnabled === 'true';
      const img = settings.bgImage;
      
      if (enabled && img) {
        bgLayer.style.backgroundImage = `url(${img})`;
        bgLayer.style.display = 'block';
      } else {
        bgLayer.style.display = 'none';
      }
    }
  }

  let postProcessTimer = null;
  let lastUpdateId = 0;
  let pendingScrollData = null;

  function updateUI(data) {
    if (!data) return;
    console.log('[Preview:Bridge] RECEIVED UI Update:', data.file);

    if (data.html !== undefined) {
      // Generate unique ID for this update to track scroll syncing
      const updateId = ++lastUpdateId;

      // 1. Instant HTML Update (Text is fast)
      mdContent.innerHTML = data.html;

      // 2. Debounced Post-Processing (Mermaid/Code is expensive)
      if (postProcessTimer) clearTimeout(postProcessTimer);
      postProcessTimer = setTimeout(() => {
        if (window.processMermaid) {
          window.processMermaid(mdContent).catch(e => console.warn('Mermaid error:', e));
        }
        if (window.CodeBlockModule) {
          window.CodeBlockModule.process(mdContent);
        }

        // 3. After content is fully stabilized, apply any pending scroll
        if (pendingScrollData && pendingScrollData.updateId === updateId) {
          console.log('[Preview:Bridge] Applying deferred scroll after content stabilization');
          _applyScroll(pendingScrollData);
          pendingScrollData = null;
        }

        postProcessTimer = null;
      }, 300);
    }

    if (data.file) {
      const fileName = data.file.split(/[/\\]/).pop();
      filename.textContent = `Live Preview — ${fileName}`;
    }
  }

  function _applyScroll(data) {
    if (!data || data.scrollPct === undefined) return;

    // Validate scroll percentage
    const validScrollPct = Math.max(0, Math.min(1, data.scrollPct));

    // Use requestAnimationFrame to ensure layout is measured in next paint
    requestAnimationFrame(() => {
      const maxScroll = mdContent.scrollHeight - mdContent.clientHeight;

      // Sanity check: if content is too short, don't scroll
      if (maxScroll <= 0) {
        console.log('[Preview:Bridge] Content too short to scroll, skipping');
        return;
      }

      const targetScroll = Math.max(0, Math.min(maxScroll, maxScroll * validScrollPct));
      mdContent.scrollTop = targetScroll;
      console.log('[Preview:Bridge] Applied scroll:', targetScroll, 'of max:', maxScroll, 'pct:', validScrollPct);
    });

    if (data.line !== undefined) {
      highlightLine(data.line);
    }
  }

  function syncScroll(data) {
    if (!data || data.scrollPct === undefined) return;
    console.log('[Preview:Bridge] RECEIVED Scroll Update:', data.scrollPct);

    // If content update is in progress (postProcessTimer is active),
    // defer the scroll application until after post-processing completes
    if (postProcessTimer) {
      console.log('[Preview:Bridge] Content update in progress, deferring scroll sync');
      pendingScrollData = { ...data, updateId: lastUpdateId };
      return;
    }

    // Otherwise apply scroll immediately with RAF for layout stability
    _applyScroll(data);
  }

  function highlightLine(lineIndex) {
    if (lineIndex === undefined || lineIndex === null) return;

    // Defer line highlighting slightly to allow layout to settle
    requestAnimationFrame(() => {
      const oldActive = mdContent.querySelector('.is-preview-active');
      if (oldActive) oldActive.classList.remove('is-preview-active');

      // Try exact match first
      let newLine = mdContent.querySelector(`[data-line="${lineIndex}"]`);

      // Fallback: try data-source-line
      if (!newLine) {
        newLine = mdContent.querySelector(`[data-source-line="${lineIndex}"]`);
      }

      // Fallback: try adjacent lines with wider range
      if (!newLine) {
        for (let offset = -10; offset <= 10; offset++) {
          if (offset === 0) continue;
          newLine = mdContent.querySelector(`[data-line="${lineIndex + offset}"], [data-source-line="${lineIndex + offset}"]`);
          if (newLine) {
            console.log(`[Preview:Bridge] Found line at offset ${offset} (wanted ${lineIndex}, found ${lineIndex + offset})`);
            break;
          }
        }
      }

      if (newLine) {
        newLine.classList.add('is-preview-active');
        const foundLine = newLine.getAttribute('data-line') || newLine.getAttribute('data-source-line');
        console.log('[Preview:Bridge] Highlighted line:', foundLine, '(requested:', lineIndex + ', offset: ' + (parseInt(foundLine) - lineIndex) + ')');

        // ── Debug: Report preview line ──
        if (window.DebugService) {
          window.DebugService.updatePreviewLine(parseInt(foundLine));
        }
      } else {
        console.warn('[Preview:Bridge] Could not find line element for:', lineIndex);

        // List all available line numbers for debugging
        const allLines = Array.from(mdContent.querySelectorAll('[data-line], [data-source-line]'));
        const availableLines = allLines
          .map(el => el.getAttribute('data-line') || el.getAttribute('data-source-line'))
          .filter((v, i, a) => a.indexOf(v) === i) // unique
          .sort((a, b) => parseInt(a) - parseInt(b));

        console.log('[Preview:Bridge] All available lines:', availableLines);
        console.log('[Preview:Bridge] Requested line:', lineIndex, 'but closest available is:', availableLines[0]);

        // ── Debug: Report line not found ──
        if (window.DebugService) {
          window.DebugService.updatePreviewLine(-1);
        }
      }
    });
  }

  // ── Initial Boot ──
  function boot() {
    console.log('[Preview:Bridge] >>> STARTING BOOT SEQUENCE');
    
    try {
      // 1. Load Theme
      console.log('[Preview:Bridge] Step 1: Loading Theme from Storage...');
      const settings = {
        accentColor: localStorage.getItem('md-accent-color'),
        fontText: localStorage.getItem('md-font-text'),
        fontCode: localStorage.getItem('md-font-code'),
        bgEnabled: localStorage.getItem('md-bg-enabled') === 'true',
        bgImage: localStorage.getItem('md-bg-image')
      };
      applyTheme(settings);
      console.log('[Preview:Bridge] Step 1: Theme applied successfully');

      // 2. Init Mermaid
      console.log('[Preview:Bridge] Step 2: Checking Mermaid...');
      if (window.initMermaid) {
        window.initMermaid();
        console.log('[Preview:Bridge] Step 2: Mermaid initialized');
      }
      
      // 3. Process Content
      console.log('[Preview:Bridge] Step 3: Checking initial content...');
      if (mdContent && mdContent.innerHTML) {
        console.log('[Preview:Bridge] Step 3: Processing existing HTML...');
        if (window.processMermaid) window.processMermaid(mdContent);
        if (window.CodeBlockModule) window.CodeBlockModule.process(mdContent);
      }

      // 4. Notify Main Window
      if (window.electronAPI) {
        console.log('[Preview:Bridge] Step 4: Sending READY signal to Main Window (Electron)...');
        window.electronAPI.previewReady();
      } else if (window.opener) {
        console.log('[Preview:Bridge] Step 4: Sending READY signal to Opener (Web)...');
        window.opener.postMessage({ type: 'preview-ready' }, window.location.origin);
      } else {
        console.warn('[Preview:Bridge] Step 4 FAILED: No communication channel found (No electronAPI, no opener)');
      }

      console.log('[Preview:Bridge] <<< BOOT SEQUENCE COMPLETE');
    } catch (err) {
      console.error('[Preview:Bridge] !!! BOOT FAILED at some step:', err);
    }
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
