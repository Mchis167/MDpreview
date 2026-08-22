const vscode = require('vscode');
const crypto = require('crypto');

function getNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Builds the preview webview's document: which vendored stylesheets and scripts
 * it loads, and the host-override CSS that keeps VSCode's injected defaults from
 * repainting the design system.
 */
function buildHtml(webview, sharedRoot, rendererRoot, mediaRoot) {
  const mdRenderDir = (name) => vscode.Uri.joinPath(sharedRoot, 'md-render', name);
  const cssUris = [
    webview.asWebviewUri(mdRenderDir('tokens.css')),
    webview.asWebviewUri(mdRenderDir('md-render.css')),
    webview.asWebviewUri(mdRenderDir('markdown-content.css')),
    webview.asWebviewUri(mdRenderDir('markdown-blocks.css')),
    webview.asWebviewUri(mdRenderDir('markdown-interactions.css')),
    webview.asWebviewUri(mdRenderDir('mockup-frames.css')),
    webview.asWebviewUri(mdRenderDir('carousel.css')),
    webview.asWebviewUri(mdRenderDir('checkbox.css'))
  ];
  // The design system pieces the font panel is built from — the same
  // popover card, group cards, setting rows and segmented control the
  // app's own Settings popover uses.
  const dsDir = (name) => vscode.Uri.joinPath(rendererRoot, 'css', name);
  const dsCssUris = [
    webview.asWebviewUri(dsDir('popover-shield.css')),
    webview.asWebviewUri(dsDir('setting-row.css')),
    webview.asWebviewUri(dsDir('segmented-control.css')),
    webview.asWebviewUri(dsDir('switch-toggle.css')),
    webview.asWebviewUri(dsDir('tooltip.css')),
    webview.asWebviewUri(dsDir('settings-panel.css')),
    webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'font-kit', 'picker.css')),
    webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'theme-kit', 'appearance.css')),
    // Comment UI: the real trigger/form/sidebar organisms, not a lookalike.
    webview.asWebviewUri(dsDir('button.css')),
    webview.asWebviewUri(dsDir('icon-action-button.css')),
    webview.asWebviewUri(dsDir('comment-form.css')),
    webview.asWebviewUri(dsDir('sidebar-base.css')),
    webview.asWebviewUri(dsDir('right-sidebar.css')),
    webview.asWebviewUri(dsDir('tab-bar.css')),
    // TOC panel + the floating bar it is toggled from. toc-panel.css pulls in
    // toc-core.css itself through a (vendor-flattened) @import.
    webview.asWebviewUri(dsDir('toc-panel.css')),
    webview.asWebviewUri(dsDir('change-action-view-bar.css')),
    webview.asWebviewUri(dsDir('zoom-modal.css'))
  ];
  const mermaidConfigUri = webview.asWebviewUri(
    vscode.Uri.joinPath(rendererRoot, 'js', 'services', 'mermaid-config.js')
  );
  const mermaidLibUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'vendor', 'mermaid.min.js'));
  const codeBlocksUri = webview.asWebviewUri(
    vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'code-blocks.js')
  );
  const componentDir = (...parts) =>
    webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'components', ...parts));
  // The real design-system.js, not the old shim: the font panel needs its
  // popover/select/segmented factories. Every component it delegates to is
  // behind a `typeof X !== 'undefined'` guard, so the ones not vendored
  // here simply return null rather than throwing.
  const designSystemUris = [
    componentDir('atoms', 'modal.js'),
    // ModalComponent.confirm's footer is built from ButtonComponent — without
    // it the delete-confirmation dialog would come up with no buttons.
    componentDir('atoms', 'button.js'),
    componentDir('atoms', 'select.js'),
    componentDir('atoms', 'segmented-control.js'),
    // The Background section's on/off switch.
    componentDir('atoms', 'switch-toggle.js'),
    componentDir('atoms', 'icon-action-button.js'),
    componentDir('molecules', 'setting-row.js'),
    componentDir('organisms', 'comment-form-component.js'),
    componentDir('organisms', 'right-sidebar.js'),
    componentDir('design-system.js')
  ];
  // The shared kits, plus the ui adapter both are built on. theme.js must
  // come before appearance.js, which reads ThemeKit off the window.
  const fontKitUris = [
    webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'font-kit', 'picker.js')),
    webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'theme-kit', 'theme.js')),
    webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'theme-kit', 'appearance.js')),
    webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'ui-mdpreview.js'))
  ];
  const settingsScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'settings.js'));
  const settingsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'settings.css'));
  // The app's TOC, verbatim: ui-utils supplies the scroll mask and skeleton
  // toc-component asks for, toc-service the heading scan and scroll offset.
  const tocUris = [
    webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'services', 'ui-utils.js')),
    webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'services', 'toc-service.js')),
    componentDir('organisms', 'toc-component.js'),
    webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'toc.js'))
  ];
  const actionBarUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'actionbar.js'));
  const designSystemIconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(rendererRoot, 'js', 'components', 'design-system-icons.js')
  );
  const mockupImagesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'mockup-images.js')
  );
  const carouselUri = webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'carousel.js'));
  // Full-screen pan/zoom for diagrams and images. Mockups and carousels call
  // into it on their own; webview.js wires the mermaid diagrams to it.
  const zoomUri = webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'zoom.js'));
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'webview.js'));
  const commentAnchorUri = webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'comment-anchor.js'));
  // Layout glue only (flex split between content and the right sidebar) —
  // the comment UI itself is styled entirely by the vendored DS CSS above.
  const commentsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'comments.css'));
  const commentsScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'comments.js'));
  // Tag chips and pasted-image attachments, added onto the vendored comment
  // form from the outside so re-vendoring never has to carry them.
  const commentComposeUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'commentCompose.js'));
  const diffCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'diff.css'));
  const diffScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'diff.js'));
  const nonce = getNonce();

  const actionBarCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'actionbar.css'));
  const tocCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'toc.css'));

  const cssLinks = [...cssUris, ...dsCssUris, commentsCssUri, settingsCssUri, diffCssUri, actionBarCssUri, tocCssUri]
    .map((uri) => `  <link rel="stylesheet" href="${uri}">`)
    .join('\n');
  const dsScripts = [...designSystemUris, ...fontKitUris]
    .map((uri) => `  <script nonce="${nonce}" src="${uri}"></script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- style-src needs 'unsafe-inline': mermaid injects its own <style> at runtime
       (createElement("style"), no nonce) and that stylesheet is what sets
       .flowchart-link { fill: none } — without it every edge renders as a solid
       black blob. Note a nonce in style-src would make 'unsafe-inline' be ignored,
       so it is deliberately absent here. The main app's CSP does the same. -->
  <!-- font-src: fonts downloaded by the font panel are served from the
       extension's globalStorage, which asWebviewUri maps onto cspSource.
       Nothing is loaded from fonts.gstatic.com at render time — the page
       never talks to Google; only the extension host does, at download time. -->
  <!-- img-src: cspSource covers images stored under .mdpreview/ (comment
       attachments) and anything else asWebviewUri maps in; data: is what a
       clipboard paste produces, shown as a thumbnail before it is saved. -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}';">
${cssLinks}
  <style>
    /* Layout glue only, mirroring the app's #app-layout / main split so the
       vendored .ds-right-sidebar-wrap takes real flex width instead of
       covering the content. Everything inside is styled by vendored DS CSS. */
    body {
      background: var(--ds-bg-base);
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    #app-layout {
      display: flex;
      height: 100vh;
      padding: var(--ds-space-sm);
      gap: var(--ds-space-sm);
      box-sizing: border-box;
    }

    main {
      flex: 1;
      min-width: 0;
      display: flex;
      overflow: hidden;
      position: relative; /* anchors the comment-mode toggle */
    }

    /* Same two-level split as the app: the mount is the positioned, clipped
       frame that the TOC panel and the floating bar are absolutely placed
       against (and that toc-panel.css hangs its offset variables off), while
       the viewport inside it is what actually scrolls. */
    #md-viewer-mount {
      flex: 1;
      min-width: 0;
      display: flex;
      position: relative;
      overflow: hidden;
    }

    .md-viewer-viewport {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      padding: 2rem 3rem;
      /* Room to scroll the last line clear of the floating action bar —
         without it, content at the very bottom of the document ends up
         permanently hidden underneath the bar once scrollTop maxes out. */
      padding-bottom: calc(2rem + var(--mdp-bar-clearance, 100px));
    }

    /* The host injects, into every webview, a rule inside the cascade layer
       "vscode-default" that gives bare CODE elements a background-color of
       var(--vscode-textPreformat-background) plus colour/padding/border-radius.
       Because it targets bare CODE it hit both inline code and code inside PRE,
       painting a grey chip the desktop app never has — md-render.css
       deliberately gives inline code an accent colour and no background at all.
       Unlayered rules always beat layered ones regardless of specificity, so
       this plain reset neutralises it; md-render.css's own .md-render-body code
       rule (higher specificity) then styles it as designed. */
    code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border-radius: 0;
      font-family: inherit;
    }

    /* Same story for form controls: the host's layered defaults paint every
       BUTTON with var(--vscode-button-background) (a light fill) plus its own
       padding/radius/font. The design system's buttons are transparent icon
       targets — .ds-header-action in particular never declares a background,
       so without this reset it renders as a white box. Class selectors in the
       vendored CSS out-specify these bare element rules, so the ones that do
       declare a background (.ds-icon-action-btn, .ds-btn-primary) still win. */
    button,
    textarea,
    input {
      background: none;
      border: none;
      border-radius: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      text-align: inherit;
      outline: none;
    }

    /* No scrollbar at all: restyling it never took — the host's injected
       rules kept painting a track. The published-page approach is used
       instead (cf-publish-worker/public/publish.css), where the scrollbar is
       hidden and a reading-progress bar stands in for it. scrollbar-width
       is the standards property and wins outright over ::-webkit-scrollbar,
       so the host has nothing left to override. */
    * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    /* Same bar the published pages use (cf-publish-worker/src/publish-styles.css).
       There it hangs off the bottom of the page header; this webview has no
       header, so it pins to the top of the content area instead. */
    .ds-reading-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 2px;
      width: 0; /* Updated via JS */
      background: var(--ds-accent);
      transition: width 0.1s ease-out;
      z-index: 1001;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <!-- Same shape as the app's index.html: a flex layout with the viewer on
       the left and the right sidebar as its sibling, so the panel takes real
       width instead of covering the content. -->
  <div id="app-layout">
    <main>
      <!-- Full-bleed layer the chosen background image paints onto, behind
           everything. theme-kit shows and hides it. -->
      <div id="app-background"></div>
      <div id="ds-reading-progress" class="ds-reading-progress"></div>
      <div id="md-viewer-mount">
        <div class="md-viewer-viewport">
          <div id="md-content" class="md-render-body"></div>
        </div>
      </div>
    </main>
    <!-- RightSidebarComponent builds everything inside this mount itself. -->
    <div id="right-sidebar-wrap" class="ds-right-sidebar-wrap"></div>
  </div>
  <script nonce="${nonce}" src="${mermaidConfigUri}"></script>
  <script nonce="${nonce}" src="${mermaidLibUri}"></script>
  <script nonce="${nonce}" src="${codeBlocksUri}"></script>
${dsScripts}
  <script nonce="${nonce}" src="${designSystemIconsUri}"></script>
  <script nonce="${nonce}" src="${zoomUri}"></script>
  <script nonce="${nonce}" src="${mockupImagesUri}"></script>
  <script nonce="${nonce}" src="${carouselUri}"></script>
  <script nonce="${nonce}" src="${commentAnchorUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
  <script nonce="${nonce}" src="${commentComposeUri}"></script>
  <script nonce="${nonce}" src="${commentsScriptUri}"></script>
  <script nonce="${nonce}" src="${diffScriptUri}"></script>
  <script nonce="${nonce}" src="${settingsScriptUri}"></script>
${tocUris.map((uri) => `  <script nonce="${nonce}" src="${uri}"></script>`).join('\n')}
  <!-- Last: the bar wires itself to the panels the scripts above registered. -->
  <script nonce="${nonce}" src="${actionBarUri}"></script>
</body>
</html>`;
}

module.exports = { buildHtml, getNonce };
