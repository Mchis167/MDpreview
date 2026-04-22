/* ============================================================
   settings.js — Setting Modal logic & Persistence
   ============================================================ */

const SettingsModule = (() => {

  const accentColors = [
    { name: 'Orange', value: '#ffbf48' },
    { name: 'Red',    value: '#FF4500' },
    { name: 'Pink',   value: '#FF69B4' },
    { name: 'Purple', value: '#9370DB' },
    { name: 'Blue',   value: '#1E90FF' },
    { name: 'Teal',   value: '#40E0D0' },
    { name: 'Cyan',   value: '#00FFFF' },
    { name: 'Lime',   value: '#00FF00' },
    { name: 'Green',  value: '#ADFF2F' }
  ];

  function init() {
    const modal = document.getElementById('setting-modal');
    const openBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    
    if (!modal) return;

    // ── Modal Toggle ──────────────────────────────────────────
    if (openBtn) {
      openBtn.addEventListener('click', () => modal.classList.add('show'));
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    }

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });

    // ── Accent Color Selector ──────────────────────────────────
    const colorSelector = modal.querySelector('.color-selector');
    if (colorSelector) {
      renderColors(colorSelector);
    }

    // ── Custom Background Toggle ──────────────────────────────
    const imageGrid = modal.querySelector('.bg-image-grid');
    const bgToggleContainer = document.getElementById('bg-toggle-mount');

    const updateGridVisibility = (enabled) => {
      if (imageGrid) {
        imageGrid.style.display = enabled ? 'grid' : 'none';
        // Handle label sibling visibility as well
        const gridLabel = imageGrid.previousElementSibling;
        if (gridLabel && gridLabel.classList.contains('settings-label')) {
          gridLabel.style.display = enabled ? 'block' : 'none';
        }
      }
    };

    // ── Explorer Toggles ──────────────────────────────────────
    const mountToggle = (id, stateKey, storageKey) => {
      SwitchToggleModule.init({
        containerId: id,
        isOn: AppState.settings[stateKey],
        onChange: (val) => {
          AppState.settings[stateKey] = val;
          localStorage.setItem(storageKey, val);
          if (typeof TreeModule !== 'undefined') TreeModule.load();
        }
      });
    };

    mountToggle('hidden-toggle-mount', 'showHidden', 'md-show-hidden');
    mountToggle('empty-toggle-mount',  'hideEmptyFolders', 'md-hide-empty');
    mountToggle('flat-toggle-mount',   'flatView', 'md-flat-view');

    // ── Text Zoom ─────────────────────────────────────────────
    const zoomSlider = document.getElementById('text-zoom-slider');
    const zoomVal    = document.getElementById('text-zoom-val');
    if (zoomSlider && zoomVal) {
      zoomSlider.value = AppState.settings.textZoom || 100;
      zoomVal.innerText = `${zoomSlider.value}%`;
      zoomSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        zoomVal.innerText = `${val}%`;
        AppState.settings.textZoom = parseInt(val, 10);
        localStorage.setItem('md-text-zoom', val);
        applyTheme();
      });
    }

    const codeZoomSlider = document.getElementById('code-zoom-slider');
    const codeZoomVal    = document.getElementById('code-zoom-val');
    if (codeZoomSlider && codeZoomVal) {
      codeZoomSlider.value = AppState.settings.codeZoom || 100;
      codeZoomVal.innerText = `${codeZoomSlider.value}%`;
      codeZoomSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        codeZoomVal.innerText = `${val}%`;
        AppState.settings.codeZoom = parseInt(val, 10);
        localStorage.setItem('md-code-zoom', val);
        applyTheme();
      });
    }

    if (bgToggleContainer) {
      SwitchToggleModule.init({
        containerId: 'bg-toggle-mount',
        isOn: AppState.settings.bgEnabled,
        onChange: (val) => {
          AppState.settings.bgEnabled = val;
          localStorage.setItem('md-bg-enabled', val);
          updateGridVisibility(val);
          applyTheme();
        }
      });
    }

    // ── Background Image Grid ──────────────────────────────────
    if (imageGrid) {
      setupImageGrid(imageGrid);
      updateGridVisibility(AppState.settings.bgEnabled);
    }
    
    // Initial Application
    applyTheme();
  }

  function renderColors(container) {
    container.innerHTML = '';
    accentColors.forEach(color => {
      const item = document.createElement('div');
      item.className = 'color-item';
      if (color.value === AppState.settings.accentColor) item.classList.add('active');
      item.style.backgroundColor = color.value;
      item.title = color.name;
      
      item.addEventListener('click', () => {
        AppState.settings.accentColor = color.value;
        localStorage.setItem('md-accent-color', color.value);
        
        container.querySelectorAll('.color-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        applyTheme();
      });
      
      container.appendChild(item);
    });
  }

  function setupImageGrid(container) {
    const uploadTrigger = document.getElementById('bg-upload-trigger');
    const fileInput     = document.getElementById('bg-file-input');
    const customList    = document.getElementById('custom-bg-list');

    if (uploadTrigger && fileInput) {
      uploadTrigger.addEventListener('click', (e) => {
        if (e.target === fileInput) return;
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let customBgs = _getCustomBgs();
        for (const file of files) {
          if (customBgs.length >= 5) {
            alert("Maximum 5 custom images allowed.");
            break;
          }
          const base64 = await _toBase64(file);
          customBgs.push(base64);
        }
        localStorage.setItem('mdpreview_custom_bg_images', JSON.stringify(customBgs));
        _renderCustomBgs(customList, container);
      });
    }

    _renderCustomBgs(customList, container);
  }

  function _getCustomBgs() {
    try {
      return JSON.parse(localStorage.getItem('mdpreview_custom_bg_images') || '[]');
    } catch (e) { return []; }
  }

  function _toBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  function _renderCustomBgs(listEl, container) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const bgs = _getCustomBgs();
    bgs.forEach(src => {
      const item = document.createElement('div');
      item.className = 'bg-image-item';
      if (src === AppState.settings.bgImage) item.classList.add('active');
      item.innerHTML = `<img src="${src}" alt="Custom">`;
      listEl.appendChild(item);
    });
    
    _bindClickToItems(container);
  }

  function _bindClickToItems(container) {
    // Collect both preset and custom images
    const images = container.querySelectorAll('.bg-image-item:not(.bg-new-image)');
    images.forEach(img => {
      const innerImg = img.querySelector('img');
      if (!innerImg) return;

      // Clean up previous listeners by replacing node
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);

      newImg.addEventListener('click', () => {
        const src = newImg.querySelector('img').src;
        AppState.settings.bgImage = src;
        localStorage.setItem('md-bg-image', src);
        
        container.querySelectorAll('.bg-image-item').forEach(el => el.classList.remove('active'));
        newImg.classList.add('active');
        
        applyTheme();
      });
      
      if (innerImg.src === AppState.settings.bgImage) {
        newImg.classList.add('active');
      }
    });
  }

  return { init };
})();
