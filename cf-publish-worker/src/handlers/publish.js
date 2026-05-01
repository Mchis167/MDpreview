import { render } from '../renderer.js';
import { buildShell } from '../shell.js';
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
  let { slug, content, password, title, filePath } = body;
  if (slug) slug = slug.toLowerCase();

  if (!isValidSlug(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // Render
  const renderedHtml = render(content);
  const fullHtml = buildShell({ slug, html: renderedHtml, title });

  // Password hash
  const passwordHash = password ? await hashPassword(password) : null;

  const meta = {
    slug,
    title,
    filePath,
    passwordHash,
    updatedAt: new Date().toISOString()
  };

  // Save to KV
  await env.PUB_STORE.put(`pub:${slug}:html`, fullHtml);
  await env.PUB_STORE.put(`pub:${slug}:meta`, JSON.stringify(meta));

  return new Response(JSON.stringify({ 
    success: true, 
    slug, 
    updatedAt: meta.updatedAt 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
