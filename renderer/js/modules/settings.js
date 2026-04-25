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

  function open() {
    if (typeof SettingsComponent !== 'undefined') {
      SettingsComponent.open();
    }
  }

  function close() {
    // The PopoverShield handles its own closing logic,
    // but we can trigger it via the DesignSystem if we had a reference.
    // For now, most close actions are via the "X" button or backdrop.
    const shield = document.querySelector('.ds-popover-shield.show');
    if (shield) {
      shield.click(); // Trigger backdrop click to close
    }
  }

  function init() {
    // Note: Elements are now dynamic. We look for them in the DOM.
    const container = document.querySelector('.settings-organism');
    if (!container) return;

    // ── Accent Color Selector ──────────────────────────────────
    const colorSelector = container.querySelector('.color-selector');
    if (colorSelector) {
      renderColors(colorSelector);
    }

    // ── Custom Background Toggle ──────────────────────────────
    const imageGrid = container.querySelector('.bg-image-grid');
    const bgToggleContainer = document.getElementById('bg-toggle-mount');

    const updateGridVisibility = (enabled) => {
      const wrapper = document.getElementById('bg-grid-wrapper');
      if (wrapper) {
        wrapper.style.display = enabled ? 'block' : 'none';
      }
    };

    // ── Background Toggle ──────────────────────────────────────
    if (bgToggleContainer) {
      SwitchToggleModule.init({
        containerId: 'bg-toggle-mount',
        isOn: AppState.settings.bgEnabled,
        onChange: (val) => {
          AppState.settings.bgEnabled = val;
          localStorage.setItem('md-bg-enabled', val);
          updateGridVisibility(val);
          applyTheme();
          if (typeof AppState !== 'undefined' && AppState.savePersistentState) {
            AppState.savePersistentState();
          }
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
        if (typeof AppState !== 'undefined' && AppState.savePersistentState) {
          AppState.savePersistentState();
        }
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
            if (typeof showToast === 'function') showToast("Maximum 5 custom images allowed.", 'error');
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
    } catch (_e) { return []; }
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

  function updateFont(type, font) {
    let fontVal = font;
    if (font === 'System Default') fontVal = 'var(--font-text-system)';
    if (font === 'System Mono') fontVal = 'var(--font-code-system)';

    if (type === 'text') {
      AppState.settings.fontText = fontVal;
      localStorage.setItem('md-font-text', fontVal);
    } else {
      AppState.settings.fontCode = fontVal;
      localStorage.setItem('md-font-code', fontVal);
    }
    applyTheme();
  }

  return { init, open, close, updateFont };
})();
window.SettingsModule = SettingsModule;
