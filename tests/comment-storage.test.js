import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// commentStorage requires `vscode`, which only exists inside an extension
// host — point that name at a filesystem-backed stub before loading it.
const { installVscodeStub } = require('./stubs/vscode.cjs');
const { Uri } = installVscodeStub();
const { createCommentStorage } = require('../vscode-extension/commentStorage.js');

let root;
let storage;

const REL = 'docs/plan.md';
const storePath = (...parts) => path.join(root, '.mdpreview', 'comments', ...parts);
const readStore = () => JSON.parse(fs.readFileSync(storePath('docs', 'plan.md.json'), 'utf8'));
const dataUrl = (text) => `data:image/png;base64,${Buffer.from(text).toString('base64')}`;

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-store-')));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  storage = createCommentStorage({ uri: Uri.file(root) });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const save = (data) => storage.save(null, REL, data);

describe('save', () => {
  it('stores a plain comment with a generated id', async () => {
    const comment = await save({ text: 'sửa chỗ này', lineStart: 3 });

    expect(comment.id).toBeTruthy();
    expect(comment.createdAt).toBeTruthy();
    expect(readStore()).toHaveLength(1);
  });

  it('keeps a recognised tag and drops an unrecognised one', async () => {
    expect((await save({ text: 'a', tag: 'Bug' })).tag).toBe('bug');
    expect(await save({ text: 'b', tag: 'wishlist' })).not.toHaveProperty('tag');
    expect(await save({ text: 'c' })).not.toHaveProperty('tag');
  });

  it('writes pasted images into assets/, named after the comment', async () => {
    const comment = await save({ text: 'nút vỡ', pendingImages: [dataUrl('one'), dataUrl('two')] });

    expect(comment.images).toEqual([`assets/${comment.id}-1.png`, `assets/${comment.id}-2.png`]);
    expect(fs.readFileSync(storePath('assets', `${comment.id}-1.png`), 'utf8')).toBe('one');
    // pendingImages is a transport field — it must not reach the JSON.
    expect(readStore()[0]).not.toHaveProperty('pendingImages');
  });

  it('ignores clipboard payloads that are not images', async () => {
    const comment = await save({ text: 'x', pendingImages: ['data:text/plain;base64,aGk=', 'nonsense'] });
    expect(comment).not.toHaveProperty('images');
    expect(fs.existsSync(storePath('assets'))).toBe(false);
  });

  it('appends new images to the ones an edited comment keeps', async () => {
    const first = await save({ text: 'a', pendingImages: [dataUrl('one')] });
    const edited = await save({
      id: first.id,
      text: 'a, thêm ảnh',
      images: first.images,
      pendingImages: [dataUrl('two')]
    });

    expect(edited.id).toBe(first.id);
    expect(edited.images).toHaveLength(2);
    expect(readStore()).toHaveLength(1);
  });

  it('deletes an image the user removed while editing', async () => {
    const first = await save({ text: 'a', pendingImages: [dataUrl('one'), dataUrl('two')] });
    const dropped = first.images[0];

    const edited = await save({ id: first.id, text: 'a', images: [first.images[1]] });

    expect(edited.images).toEqual([first.images[1]]);
    expect(fs.existsSync(storePath(dropped))).toBe(false);
    expect(fs.existsSync(storePath(first.images[1]))).toBe(true);
  });

  it('strips the display-only imageUris the webview sends back', async () => {
    await save({ text: 'a', imageUris: ['vscode-webview://x/1.png'] });
    expect(readStore()[0]).not.toHaveProperty('imageUris');
  });
});

describe('gitignore', () => {
  it('adds .mdpreview/ to a git repo that does not ignore it yet', async () => {
    fs.mkdirSync(path.join(root, '.git'));
    await save({ text: 'a' });
    expect(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')).toContain('.mdpreview/');
  });

  it('leaves an existing entry alone rather than stacking duplicates', async () => {
    fs.mkdirSync(path.join(root, '.git'));
    fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n.mdpreview\n');
    await save({ text: 'a' });
    expect(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')).toBe('node_modules\n.mdpreview\n');
  });

  it('does not create a .gitignore in a folder that is not a git repo', async () => {
    await save({ text: 'a' });
    expect(fs.existsSync(path.join(root, '.gitignore'))).toBe(false);
  });
});

describe('remove and clear', () => {
  it('deletes the images belonging to the removed comment only', async () => {
    const kept = await save({ text: 'giữ', pendingImages: [dataUrl('keep')] });
    const gone = await save({ text: 'xoá', pendingImages: [dataUrl('bye')] });

    await storage.remove(null, REL, gone.id);

    expect(fs.existsSync(storePath(gone.images[0]))).toBe(false);
    expect(fs.existsSync(storePath(kept.images[0]))).toBe(true);
  });

  it('clear removes every comment and every image', async () => {
    await save({ text: 'a', pendingImages: [dataUrl('one')] });
    await save({ text: 'b', pendingImages: [dataUrl('two')] });

    await storage.clear(null, REL);

    expect(fs.existsSync(storePath('assets'))).toBe(false);
  });
});

describe('pruning the tree', () => {
  it('deletes the store file and its empty parents once the last comment goes', async () => {
    const c = await save({ text: 'a' });
    await storage.remove(null, REL, c.id);

    // Nothing left anywhere: no `[]` file, no docs/, no .mdpreview/.
    expect(fs.existsSync(path.join(root, '.mdpreview'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(true);
  });

  it('keeps directories another file still occupies', async () => {
    const c = await save({ text: 'a' });
    await storage.save(null, 'docs/other.md', { text: 'b' });

    await storage.remove(null, REL, c.id);

    expect(fs.existsSync(storePath('docs', 'other.md.json'))).toBe(true);
    expect(fs.existsSync(storePath('docs', 'plan.md.json'))).toBe(false);
  });

  it('keeps .mdpreview alive while images are still referenced', async () => {
    const c = await save({ text: 'a', pendingImages: [dataUrl('one')] });
    // Emptying the list writes first, images are cleaned up after — the
    // in-between state must not take the whole tree with it.
    await storage.remove(null, REL, c.id);
    expect(fs.existsSync(path.join(root, '.mdpreview'))).toBe(false);
  });
});

describe('archive', () => {
  async function archive(comment) {
    const dir = storePath('.archive', 'docs');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'plan.md.json'), JSON.stringify([comment]));
  }

  it('restores a comment with its tag and images intact', async () => {
    await archive({ id: 'c1', text: 'a', tag: 'bug', images: ['assets/c1-1.png'], consumedAt: 'x' });

    const restored = await storage.restore(REL, 'c1');

    expect(restored.tag).toBe('bug');
    expect(restored.images).toEqual(['assets/c1-1.png']);
    expect(restored).not.toHaveProperty('consumedAt');
    // The emptied archive file goes away rather than lingering as `[]`.
    expect(fs.existsSync(storePath('.archive', 'docs', 'plan.md.json'))).toBe(false);
  });

  it('deleting an archived comment takes its images with it', async () => {
    fs.mkdirSync(storePath('assets'), { recursive: true });
    fs.writeFileSync(storePath('assets', 'c1-1.png'), 'png');
    await archive({ id: 'c1', text: 'a', images: ['assets/c1-1.png'] });

    await storage.deleteArchived(REL, 'c1');

    expect(fs.existsSync(storePath('assets', 'c1-1.png'))).toBe(false);
  });

  it('clearing the archive takes every image with it', async () => {
    fs.mkdirSync(storePath('assets'), { recursive: true });
    fs.writeFileSync(storePath('assets', 'c1-1.png'), 'png');
    await archive({ id: 'c1', text: 'a', images: ['assets/c1-1.png'] });

    await storage.clearArchive(REL);

    expect(fs.existsSync(storePath('assets', 'c1-1.png'))).toBe(false);
  });
});
