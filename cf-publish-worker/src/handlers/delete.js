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

  // 3. Clear Assets from R2
  try {
    const listed = await env.PUB_ASSETS.list({ prefix: `pub/${slug}/assets/` });
    for (const obj of listed.objects) {
      await env.PUB_ASSETS.delete(obj.key);
    }
  } catch (err) {
    console.error(`[Delete] Failed to clear R2 assets for ${slug}:`, err.message);
    // Continue anyway as KV is already cleared
  }

  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
