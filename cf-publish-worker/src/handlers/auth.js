/**
 * Authentication helpers
 */
export function checkAdminSecret(request, env) {
  const secret = request.headers.get('X-Admin-Secret');
  return secret === env.ADMIN_SECRET;
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
