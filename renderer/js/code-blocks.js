/* ============================================================
   code-blocks.js — Syntax highlighting enhancements, copy button, badges
   ============================================================ */

const CodeBlockModule = {
  /**
   * Process all code blocks in a container to add UI enhancements
   */
  process(container) {
    const codeBlocks = container.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeEl => {
      const preEl = codeEl.parentElement;
      if (preEl.classList.contains('code-block-processed')) return;
      
      // 1. Identify language
      let lang = 'text';
      const langMatch = codeEl.className.match(/language-([^\s]+)/);
      if (langMatch) {
        lang = langMatch[1].toUpperCase();
      }
      
      // 2. Create Wrapper & Header
      const wrapper = document.createElement('div');
      wrapper.className = 'premium-code-block';
      
      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span class="code-block-lang">${lang}</span>
        <button class="code-block-copy" title="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="icon-check hidden"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Copy</span>
        </button>
      `;
      
      // 3. Setup Copy Logic
      const copyBtn = header.querySelector('.code-block-copy');
      copyBtn.addEventListener('click', () => {
        const text = codeEl.innerText;
        navigator.clipboard.writeText(text).then(() => {
          this.showCopiedState(copyBtn);
        });
      });
      
      // 4. Rearrange DOM
      preEl.parentNode.insertBefore(wrapper, preEl);
      wrapper.appendChild(header);
      wrapper.appendChild(preEl);
      
      preEl.classList.add('code-block-processed');
    });
  },

  /**
   * Handle the "Copied!" feedback state
   */
  showCopiedState(btn) {
    const iconCopy = btn.querySelector('.icon-copy');
    const iconCheck = btn.querySelector('.icon-check');
    const textSpan = btn.querySelector('span');
    
    btn.classList.add('copied');
    iconCopy.classList.add('hidden');
    iconCheck.classList.remove('hidden');
    textSpan.innerText = 'Copied!';
    
    setTimeout(() => {
      btn.classList.remove('copied');
      iconCopy.classList.remove('hidden');
      iconCheck.classList.add('hidden');
      textSpan.innerText = 'Copy';
    }, 2000);
  }
};
