/**
 * Assets Handler - Xử lý lưu trữ và truy xuất hình ảnh từ R2.
 */

export async function handleAssetUpload(request, env, slug) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('name');

  if (!filename) {
    return new Response(JSON.stringify({ error: 'Missing filename in query (?name=...)' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Lưu binary data trực tiếp vào R2
    // Thư mục: pub/{slug}/assets/{filename}
    await env.PUB_ASSETS.put(`pub/${slug}/assets/${filename}`, request.body, {
      httpMetadata: {
        contentType: _getContentType(filename)
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      url: `/${slug}/assets/${filename}` 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleAssetServe(request, env, slug, filename) {
  try {
    const key = `pub/${slug}/assets/${filename}`;
    const object = await env.PUB_ASSETS.get(key);

    if (!object) {
      return new Response('Asset Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache mạnh cho assets

    return new Response(object.body, {
      headers
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

/**
 * Helper để xác định Content-Type dựa trên extension.
 * Vì chúng ta ép về WebP khi publish nên mặc định thường là webp.
 */
function _getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'webp': return 'image/webp';
    case 'png':  return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif':  return 'image/gif';
    case 'svg':  return 'image/svg+xml';
    default:     return 'application/octet-stream';
  }
}
