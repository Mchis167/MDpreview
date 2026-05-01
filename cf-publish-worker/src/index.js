import { handlePublish } from './handlers/publish.js';
import { handleServe } from './handlers/serve.js';
import { handleDelete } from './handlers/delete.js';
import { checkAdminSecret } from './handlers/auth.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
        }
      });
    }

    try {
      // API Routes
      if (request.method === 'POST' && path === '/publish') {
        const res = await handlePublish(request, env);
        _addCors(res);
        return res;
      }

      if (request.method === 'GET' && path === '/check-slug') {
        const slug = url.searchParams.get('slug');
        if (!slug) return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
        
        const exists = await env.PUB_STORE.get(`pub:${slug}:meta`);
        const res = new Response(JSON.stringify({ exists: !!exists }), {
          headers: { 'Content-Type': 'application/json' }
        });
        _addCors(res);
        return res;
      }

      if (request.method === 'DELETE' && path.startsWith('/publish/')) {
        const slug = path.split('/')[2];
        const res = await handleDelete(request, env, slug);
        _addCors(res);
        return res;
      }

      if (request.method === 'GET' && path === '/list') {
        if (!checkAdminSecret(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        
        const list = await env.PUB_STORE.list({ prefix: 'pub:' });
        const slugs = new Set();
        list.keys.forEach(k => {
          const parts = k.name.split(':');
          if (parts[1]) slugs.add(parts[1]);
        });
        
        const res = new Response(JSON.stringify({ slugs: Array.from(slugs) }), {
          headers: { 'Content-Type': 'application/json' }
        });
        _addCors(res);
        return res;
      }

      if (request.method === 'POST' && path === '/rename') {
        if (!checkAdminSecret(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        
        const { oldSlug, newSlug } = await request.json();
        if (!oldSlug || !newSlug) return new Response(JSON.stringify({ error: 'Missing slugs' }), { status: 400 });

        // 1. Check if newSlug is taken
        const exists = await env.PUB_STORE.get(`pub:${newSlug}:meta`);
        if (exists) return new Response(JSON.stringify({ error: 'New slug already taken' }), { status: 400 });

        // 2. Get old data
        const html = await env.PUB_STORE.get(`pub:${oldSlug}:html`);
        const metaStr = await env.PUB_STORE.get(`pub:${oldSlug}:meta`);
        if (!html || !metaStr) return new Response(JSON.stringify({ error: 'Source slug not found' }), { status: 404 });

        const meta = JSON.parse(metaStr);
        meta.slug = newSlug; // Update internal slug

        // 3. Put new data
        await env.PUB_STORE.put(`pub:${newSlug}:html`, html);
        await env.PUB_STORE.put(`pub:${newSlug}:meta`, JSON.stringify(meta));

        // 4. Delete old data
        await env.PUB_STORE.delete(`pub:${oldSlug}:html`);
        await env.PUB_STORE.delete(`pub:${oldSlug}:meta`);

        const res = new Response(JSON.stringify({ success: true, newSlug }), {
          headers: { 'Content-Type': 'application/json' }
        });
        _addCors(res);
        return res;
      }

      // Serve
      if (request.method === 'GET' && path !== '/') {
        const slug = path.slice(1);
        return handleServe(request, env, slug);
      }

      return new Response('MDpreview Publish Worker is Running', { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

function _addCors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
}
