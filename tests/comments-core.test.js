import { describe, it, expect, vi, beforeEach } from 'vitest';
const { createCommentsCore } = require('../shared/comments-core.js');

function fakeAdapter(initial = {}) {
  const files = { ...initial }; // wsId/file key -> comment[]
  const key = (wsId, file) => `${wsId}::${file}`;

  const storage = {
    get: vi.fn((wsId, file) => Promise.resolve(files[key(wsId, file)] || [])),
    save: vi.fn((wsId, file, data) => {
      const list = files[key(wsId, file)] || (files[key(wsId, file)] = []);
      let result;
      if (data.id) {
        const idx = list.findIndex(c => c.id === data.id);
        if (idx !== -1) {
          result = { ...list[idx], ...data };
          list[idx] = result;
        } else {
          result = { ...data };
          list.push(result);
        }
      } else {
        result = { ...data, id: `c${list.length + 1}` };
        list.push(result);
      }
      return Promise.resolve(result);
    }),
    remove: vi.fn((wsId, file, id) => {
      const list = (files[key(wsId, file)] || []).filter(c => c.id !== id);
      files[key(wsId, file)] = list;
      return Promise.resolve(list);
    }),
    clear: vi.fn((wsId, file) => {
      files[key(wsId, file)] = [];
      return Promise.resolve([]);
    })
  };

  let workspaceId = 'ws-1';
  let currentFile = 'docs/plan.md';
  const context = {
    workspaceId: () => workspaceId,
    currentFile: () => currentFile,
    setWorkspaceId: (v) => { workspaceId = v; },
    setCurrentFile: (v) => { currentFile = v; }
  };

  return { storage, context, files };
}

describe('comments-core: load', () => {
  it('loads comments from storage for the current workspace/file', async () => {
    const { storage, context } = fakeAdapter({ 'ws-1::docs/plan.md': [{ id: 'c1', lineStart: 1 }] });
    const core = createCommentsCore({ storage, context });

    const result = await core.load('docs/plan.md');

    expect(storage.get).toHaveBeenCalledWith('ws-1', 'docs/plan.md');
    expect(result).toHaveLength(1);
    expect(core.list()).toHaveLength(1);
  });

  it('clears list without calling storage when there is no workspace', async () => {
    const { storage, context } = fakeAdapter();
    context.setWorkspaceId(null);
    const core = createCommentsCore({ storage, context });

    const result = await core.load('docs/plan.md');

    expect(storage.get).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('clears list without calling storage when filePath is falsy', async () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });

    const result = await core.load(null);

    expect(storage.get).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

describe('comments-core: save', () => {
  it('creates a new comment and appends it, sorted by lineStart', async () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });

    await core.save({ lineStart: 5, text: 'second' });
    await core.save({ lineStart: 1, text: 'first' });

    expect(core.list().map(c => c.text)).toEqual(['first', 'second']);
  });

  it('updates an existing comment in place by id', async () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });
    const created = await core.save({ lineStart: 1, text: 'original' });

    await core.save({ id: created.id, lineStart: 1, text: 'edited' });

    expect(core.list()).toHaveLength(1);
    expect(core.list()[0].text).toBe('edited');
  });

  it('falls back to appending when an id is provided but not found locally', async () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });
    // storage.save will create a fresh comment since 'missing-id' isn't in its list either,
    // but it keeps the id as given by fakeAdapter's save() when data.id is truthy and not found.
    await core.save({ id: 'missing-id', lineStart: 3, text: 'x' });

    expect(core.list()).toHaveLength(1);
    expect(core.list()[0].id).toBe('missing-id');
  });

  it('returns null and does not call storage when there is no current file', async () => {
    const { storage, context } = fakeAdapter();
    context.setCurrentFile(null);
    const core = createCommentsCore({ storage, context });

    const result = await core.save({ lineStart: 1, text: 'x' });

    expect(result).toBeNull();
    expect(storage.save).not.toHaveBeenCalled();
  });
});

describe('comments-core: remove', () => {
  it('removes a comment by id and notifies', async () => {
    const { storage, context } = fakeAdapter();
    const notify = vi.fn();
    const core = createCommentsCore({ storage, context, notify });
    const created = await core.save({ lineStart: 1, text: 'x' });

    await core.remove(created.id);

    expect(core.list()).toHaveLength(0);
    expect(notify).toHaveBeenCalledWith('Comment removed');
  });

  it('does not notify on clear (only remove notifies)', async () => {
    const { storage, context } = fakeAdapter();
    const notify = vi.fn();
    const core = createCommentsCore({ storage, context, notify });
    await core.save({ lineStart: 1, text: 'x' });

    await core.clear();

    expect(notify).not.toHaveBeenCalled();
  });
});

describe('comments-core: onChange', () => {
  it('fires on load/save/remove/clear with the current list', async () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });
    const seen = [];
    core.onChange(list => seen.push(list.length));

    await core.load('docs/plan.md');       // []
    await core.save({ lineStart: 1 });     // [1]
    await core.save({ lineStart: 2 });     // [2]
    const c = core.list()[0];
    await core.remove(c.id);               // [1]
    await core.clear();                    // [0]

    expect(seen).toEqual([0, 1, 2, 1, 0]);
  });

  it('unsubscribe stops further notifications', async () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });
    const cb = vi.fn();
    const unsubscribe = core.onChange(cb);

    await core.save({ lineStart: 1 });
    unsubscribe();
    await core.save({ lineStart: 2 });

    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('comments-core: buildRef', () => {
  it('builds an mdp:// ref from workspace + current file', () => {
    const { storage, context } = fakeAdapter();
    const core = createCommentsCore({ storage, context });

    expect(core.buildRef('pending')).toBe('mdp://ws-1/docs%2Fplan.md?c=pending');
  });

  it('returns null when there is no workspace or file', () => {
    const { storage, context } = fakeAdapter();
    context.setWorkspaceId(null);
    const core = createCommentsCore({ storage, context });

    expect(core.buildRef('pending')).toBeNull();
  });
});
