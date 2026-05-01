export async function handleServe(request, env, slug) {
  const metaRaw = await env.PUB_STORE.get(`pub:${slug}:meta`);
  if (!metaRaw) {
    return new Response('Not Found', { status: 404 });
  }

  const meta = JSON.parse(metaRaw);

  // Simple password check (query param for now, can be improved to cookie)
  if (meta.passwordHash) {
    const url = new URL(request.url);
    const providedPass = url.searchParams.get('p');
    
    if (!providedPass) {
      return new Response('Password required. Use ?p=PASSWORD', { status: 401 });
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(providedPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hash !== meta.passwordHash) {
      return new Response('Invalid password', { status: 403 });
    }
  }

  const html = await env.PUB_STORE.get(`pub:${slug}:html`);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    }
  });
}
