// Decap CMS login, step 2: trade GitHub's code for a token and hand it back to the admin window.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').match(/cms_state=([^;]+)/);
  let status = 'error', content = { error: 'state_mismatch' };
  if (code && cookie && cookie[1] === state) {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
    });
    const data = await res.json();
    if (data.access_token) { status = 'success'; content = { token: data.access_token, provider: 'github' }; }
    else content = { error: data.error || 'no_token' };
  }
  const msg = JSON.stringify(`authorization:github:${status}:${JSON.stringify(content)}`);
  const tag = 'scr' + 'ipt';
  const html = `<!doctype html><meta charset="utf-8"><body><${tag}>
window.addEventListener('message', function (e) {
  if (e.data === 'authorizing:github') window.opener.postMessage(${msg}, e.origin);
}, false);
window.opener.postMessage('authorizing:github', '*');
</${tag}></body>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'cms_state=; Path=/api; Max-Age=0' },
  });
}
