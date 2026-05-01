import { checkAdminSecret } from './auth.js';

export async function handleDelete(request, env, slug) {
  if (!checkAdminSecret(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  await env.PUB_STORE.delete(`pub:${slug}:html`);
  await env.PUB_STORE.delete(`pub:${slug}:meta`);

  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
