/**
 * GDocUtil — Utility to transform HTML into a Google Docs-friendly format.
 * Purpose: Inlines essential CSS styles and converts SVGs (charts) to raster images.
 */
const GDocUtil = (() => {
  'use strict';

  /**
   * Transforms raw HTML into GDoc-friendly HTML by inlining styles and rasterizing SVGs.
   * @param {string} html - The raw HTML content.
   * @param {HTMLElement} sourceContainer - The DOM element where the HTML is currently rendered.
   * @returns {Promise<string>} - The transformed HTML.
   */
  async function transform(html, sourceContainer) {
    const logs = [`[GDoc Smart Copy] Started at ${new Date().toLocaleTimeString()}`];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. Handle Tables
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '16px';
      table.setAttribute('border', '1');

      table.querySelectorAll('th, td').forEach(cell => {
        cell.style.border = '1px solid #cccccc';
        cell.style.padding = '8px';
        if (cell.tagName === 'TH') {
          cell.style.backgroundColor = '#f3f3f3';
          cell.style.fontWeight = 'bold';
        }
      });
    });

    // 2. Handle Code Blocks
    const codeBlocks = tempDiv.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      block.style.backgroundColor = '#f6f8fa';
      block.style.padding = '12px';
      block.style.borderRadius = '6px';
      block.style.fontFamily = 'monospace';
      block.style.fontSize = '14px';
      block.style.lineHeight = '1.45';
      block.style.color = '#24292e';
      block.style.display = block.tagName === 'PRE' ? 'block' : 'inline';
    });

    // Syntax highlighting inlining
    const syntaxSpans = tempDiv.querySelectorAll('span[class^="hljs-"]');
    syntaxSpans.forEach(span => {
      const colorMap = {
        'hljs-keyword': '#d73a49',
        'hljs-string': '#032f62',
        'hljs-comment': '#6a737d',
        'hljs-function': '#6f42c1',
        'hljs-number': '#005cc5',
        'hljs-operator': '#d73a49',
        'hljs-title': '#6f42c1',
        'hljs-params': '#24292e'
      };
      const className = Array.from(span.classList).find(c => c.startsWith('hljs-'));
      if (className && colorMap[className]) {
        span.style.color = colorMap[className];
      }
    });

    // 3. Handle Blockquotes
    const quotes = tempDiv.querySelectorAll('blockquote');
    quotes.forEach(quote => {
      quote.style.borderLeft = '4px solid #dfe2e5';
      quote.style.paddingLeft = '16px';
      quote.style.color = '#6a737d';
      quote.style.margin = '0 0 16px 0';
    });

    // 4. Handle Charts (SVG to Image) - Sequential processing to avoid memory/IPC overflow
    const svgWrappers = Array.from(tempDiv.querySelectorAll('.mermaid-svg-wrapper, .mermaid, svg[id^="mermaid-"], svg.mermaid-svg'));
    const realWrappers = sourceContainer ? Array.from(sourceContainer.querySelectorAll('.mermaid-svg-wrapper, .mermaid, svg[id^="mermaid-"], svg.mermaid-svg')) : [];
    
    logs.push(`- Found ${svgWrappers.length} charts to process`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < svgWrappers.length; i++) {
      const progress = Math.round(((i + 1) / svgWrappers.length) * 100);
      const statusMsg = `Processing charts: ${i + 1}/${svgWrappers.length}...`;
      
      if (window.showToast) {
        window.showToast(statusMsg, 'info', { 
          id: 'gdoc-copy', 
          sticky: true,
          progress: progress
        });
      }

      const wrapper = svgWrappers[i];
      const realWrapper = realWrappers[i];
      
      const svgInTemp = wrapper.tagName === 'svg' ? wrapper : wrapper.querySelector('svg');
      const svgInReal = realWrapper ? (realWrapper.tagName === 'svg' ? realWrapper : realWrapper.querySelector('svg')) : null;
      const targetSvg = svgInReal || svgInTemp;
      
      if (targetSvg) {
        const start = Date.now();
        try {
          const imgData = await _svgToPng(targetSvg);
          const img = document.createElement('img');
          img.src = imgData;
          img.style.maxWidth = '100%';
          img.style.display = 'block';
          img.style.margin = '16px auto';
          
          wrapper.parentNode.replaceChild(img, wrapper);
          successCount++;
          const entry = `  [✓] Chart #${i + 1}: Success (${Date.now() - start}ms)`;
          logs.push(entry);
          console.warn(entry); // Real-time console feedback
        } catch (err) {
          failCount++;
          const entry = `  [✗] Chart #${i + 1}: Failed (${err.message})`;
          logs.push(entry);
          console.warn(entry); // Real-time console feedback
          console.warn(`[GDOC DEBUG] Detailed error for SVG #${i + 1}:`, err);
        }
      }
    }

    const finalHtml = tempDiv.innerHTML;
    logs.push(`- Final HTML Size: ${Math.round(finalHtml.length / 1024)} KB`);
    logs.push(`- Total Result: ${successCount} success, ${failCount} failed`);
    logs.push(`[GDoc Smart Copy] Finished at ${new Date().toLocaleTimeString()}`);
    
    // Final consolidated log
    console.warn(`\n=== GDOC COPY SUMMARY ===\n${logs.join('\n')}\n=========================`);

    return { 
      html: finalHtml, 
      successCount, 
      failCount, 
      totalCount: svgWrappers.length 
    };
  }

  /**
   * Converts an SVG element to a PNG Data URL.
   * @private
   */
  async function _svgToPng(svgElement) {
    // 1. Get dimensions from the ORIGINAL visible element
    const rect = svgElement.getBoundingClientRect();
    const width = rect.width || 100;
    const height = rect.height || 50;

    // 2. Clone and Inline Styles
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    
    // Set rendering hints on the root
    clone.style.textRendering = 'geometricPrecision';

    const sourceElements = svgElement.querySelectorAll('*');
    const cloneElements = clone.querySelectorAll('*');
    for (let i = 0; i < sourceElements.length; i++) {
      const source = sourceElements[i];
      const target = cloneElements[i];
      const computed = window.getComputedStyle(source);
      
      // Safe style properties for SVG elements
      // IMPORTANT: Never include 'transform' here as it breaks SVG attribute-based positioning
      const styleProps = [
        'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 
        'font-size', 'font-weight', 'font-style',
        'opacity', 'color', 'display', 'text-anchor', 
        'dominant-baseline', 'alignment-baseline', 'letter-spacing'
      ];
      
      for (const prop of styleProps) {
        const val = computed.getPropertyValue(prop);
        if (val) target.style.setProperty(prop, val);
      }

      // Special handling for text to prevent clipping without breaking layout
      const isText = source.tagName === 'text' || source.tagName === 'tspan' || computed.display === 'inline' || source.closest('foreignObject');
      if (isText) {
        // Force a stable font and prevent wrapping
        target.style.fontFamily = 'Arial, sans-serif';
        target.style.whiteSpace = 'pre';
      } else {
        // For non-text elements, just sync the original font-family if it exists
        const font = computed.getPropertyValue('font-family');
        if (font) target.style.fontFamily = font;
      }
    }

    // 3. High-Quality Canvas Rasterization (Renderer-side)
    // We do this in the renderer because only the browser engine can correctly layout and render complex SVGs.
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SVG rasterization timeout (5s)')), 5000);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Use 2.0 scale for Retina quality without bloating clipboard
      const scale = 2; 

      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Ensure SVG has correct dimensions and preserve original viewBox to prevent clipping
      const originalViewBox = svgElement.getAttribute('viewBox');
      if (originalViewBox) {
        clone.setAttribute('viewBox', originalViewBox);
      } else {
        clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      clone.setAttribute('width', width * scale);
      clone.setAttribute('height', height * scale);
      
      const optimizedSvgData = new XMLSerializer().serializeToString(clone);
      
      // Use Base64 Data URL instead of Blob to avoid "Tainted Canvas" security errors
      // unescape(encodeURIComponent()) ensures Unicode characters are handled correctly
      const encodedData = window.btoa(unescape(encodeURIComponent(optimizedSvgData)));
      const dataUrl = `data:image/svg+xml;base64,${encodedData}`;

      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Add dark background for consistent look in Google Docs
          ctx.fillStyle = '#1e1e1e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const result = canvas.toDataURL('image/png');
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error(`SVG render failed: ${err.message || 'Check SVG syntax'}`));
      };
      
      img.src = dataUrl;
    });
  }

  return {
    transform
  };
})();

// Export to window
window.GDocUtil = GDocUtil;
