---
name: mdp-comments
description: Use whenever a user message contains an "mdp://" ref — a pointer copied from MDpreview's "Copy for Claude" button, pointing at review comments left on a markdown file. Read and act on those comments.
---

# Read MDpreview review comments

The user reviews a document in MDpreview (a local markdown viewer app), leaves inline
comments, and pastes a line like:

```
@mdpreview docs/plan.md — 3 comments  ·  mdp://<wsId>/<encodedPath>?c=pending
```

As soon as a message contains an `mdp://` substring, call `mdp_get_comments` with that
ref **before doing anything else** — don't start editing files first. The ref may be
embedded in a larger line; pass the whole pasted line as `ref`, the tool extracts the
`mdp://...` part itself.

`mdp_get_comments` returns each comment's anchor (`lineStart`/`lineEnd`,
`selectedText`, surrounding `context`), its text, and the file's absolute path. Use
that context — not string searches — to locate what the user is referring to.

## After reading the comments

Just edit the file with your normal `Write`/`Edit` tools and tell the user in chat
what you changed for each comment (or why you didn't change something). This bridge
has no file-writing tool of its own.

There is no write-back step: do not call `mdp_reply_comment` or `mdp_resolve_comment`.
The user tracks resolution in the app's own UI, not through a reply thread written
back by Claude — those two tools exist but are only for when the user explicitly asks
you to reply to or resolve a specific comment.

## Errors

If a tool call fails with `MDPREVIEW_NOT_RUNNING`, `WORKSPACE_NOT_FOUND`,
`FILE_NOT_FOUND`, `COMMENT_NOT_FOUND`, or `BAD_REF`, surface the error to the user
plainly instead of retrying blindly — these mean the app isn't running, the ref is
stale, or the file/comment no longer exists.
