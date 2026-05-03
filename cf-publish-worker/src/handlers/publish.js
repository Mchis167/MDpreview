import { render } from '../renderer.js';
import { checkAdminSecret, hashPassword } from './auth.js';
import { isValidSlug } from '../utils/slug.js';

export async function handlePublish(request, env) {
  if (!checkAdminSecret(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const body = await request.json();
  let { slug, content, html, password, title, filePath } = body;
  if (slug) slug = slug.toLowerCase();

  if (!isValidSlug(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug format' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // Ensure we have something to publish
  if (!html && !content) {
    return new Response(JSON.stringify({ error: 'Missing content or html in payload' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // Use pre-rendered html or render from markdown
  const renderedHtml = html || render(content);

  // Password hash
  const passwordHash = password ? await hashPassword(password) : null;

  const meta = {
    slug,
    title: title || 'Untitled',
    filePath: filePath || 'unknown',
    passwordHash,
    updatedAt: new Date().toISOString()
  };

  // Save to KV
  await env.PUB_STORE.put(`pub:${slug}:html`, renderedHtml);
  await env.PUB_STORE.put(`pub:${slug}:meta`, JSON.stringify(meta));

  return new Response(JSON.stringify({ 
    success: true, 
    slug, 
    updatedAt: meta.updatedAt 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
