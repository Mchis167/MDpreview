---
name: mdp-open
description: Use right after writing or editing a markdown (.md) document that the user is meant to review in MDpreview — a local markdown viewer app. Focuses the app window and opens the file so the user can read it immediately.
---

# Open a document in MDpreview

MDpreview is a local markdown viewer/editor app with an MCP bridge tool: `mdp_open`.

Call `mdp_open` with the file's path right after you finish writing or editing a `.md`
file the user is meant to review — don't wait to be asked. Pass `wsId` too if you
already have one (e.g. from an earlier `mdp://` ref in the conversation); otherwise an
absolute path is enough — the tool auto-detects which MDpreview workspace the file
belongs to.

If `mdp_open` returns `MDPREVIEW_NOT_RUNNING`, tell the user to open the MDpreview app,
then retry once they confirm it's running. Do not poll or retry silently in a loop.

If it returns `WORKSPACE_NOT_REGISTERED`, tell the user this folder hasn't been added
as a workspace in MDpreview yet, and that they need to add it in the app before this
tool can open files in it.
