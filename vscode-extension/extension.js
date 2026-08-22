const vscode = require('vscode');
const { MdPreviewEditorProvider } = require('./previewProvider');
const takeover = require('./takeover');
const { installAll } = require('./installer');

function activate(context) {
  context.subscriptions.push(MdPreviewEditorProvider.register(context));
  takeover.activate(context);

  // Puts the stdio MCP server, its user-scope registration and the
  // mdp-comments skill in place, so installing the extension is the whole
  // setup. Version-gated, so an unchanged install does nothing. Nothing
  // here is worth failing activation over — preview and comments work
  // regardless of whether Claude Code can reach them.
  installAll();
}

function deactivate() {}

module.exports = { activate, deactivate };
