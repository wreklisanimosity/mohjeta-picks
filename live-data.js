// Full public snapshots are data requests, not website deployments.
// Nov 6 2026: each check first asks only for the row's timestamp (a few bytes); the full file is downloaded only when it
// changed. details.json (game breakdowns, simulation inputs, props board) is fetched only by pages that show it.
// Cloudflare (r2_publish.py): when cdn-config.json is on the site, every file is read from data.mohjeta.com instead
// (free data out, answered by Cloudflare's cache; the browser re-checks it with a tiny 304). Supabase stays the fallback.
(function () {
  let configuration, cdnP;
  function cdn() {
    if (!cdnP) cdnP = fetch('cdn-config.json', {cache:'no-cache', signal:AbortSignal.timeout(6000)})
      .then(r => r.ok ? r.json() : null).then(c => c && /^https:\/\/[a-z0-9.-]+$/i.test(c.base || '') ? c.base : null).catch(() => null);
    return cdnP;
  }
  window.publicCdn = cdn;
  const last = new Map(), stamp = new Map();
  const NAMES = ['data.json','ratings.json','stamps.json','details.json'];
  async function config() {
    if (!configuration) configuration = fetch('live-data-config.json', {cache:'no-cache', signal:AbortSignal.timeout(8000)})
      .then(r => { if (!r.ok) throw Error('No live feed'); return r.json(); })
      .catch(e => { configuration = null; throw e; });
    return configuration;
  }
  const ask = (c, name, cols) => fetch(c.url + '/rest/v1/public_snapshots?select=' + cols + '&name=eq.' + encodeURIComponent(name),
    {headers:{apikey:c.anon_key}, cache:'no-store', signal:AbortSignal.timeout(8000)});
  window.fetchPublicSnapshot = async function(name) {
    if (!NAMES.includes(name)) throw Error('Unknown snapshot');
    const base = await cdn();
    if (base) {
      try {
        const r = await fetch(base + '/' + name, {cache:'no-cache', signal:AbortSignal.timeout(8000)});
        if (r.ok) { last.set(name, r.clone()); return r; }
      } catch (e) {}
    }
    try {
      const c = await config();
      if (last.has(name)) {
        try {
          const q = await ask(c, name, 'updated_at');
          if (q.ok) { const s = (await q.json())[0]; if (s && s.updated_at === stamp.get(name)) return last.get(name).clone(); }
        } catch (e) { return last.get(name).clone(); }
      }
      const r = await ask(c, name, 'data,updated_at');
      if (!r.ok) throw Error('Live feed unavailable');
      const rows = await r.json(), row = rows[0];
      if (!row || !row.data || typeof row.data !== 'object' || Array.isArray(row.data)) throw Error('Missing snapshot');
      const body = JSON.stringify(row.data);
      const response = new Response(body, {headers:{'Content-Type':'application/json','ETag':row.updated_at}});
      last.set(name, response.clone());
      stamp.set(name, row.updated_at);
      return response;
    } catch (e) {
      // Never replace a good live snapshot with an older GitHub copy mid-session.
      if (last.has(name)) return last.get(name).clone();
      if (name === 'details.json') return new Response('{}', {status:404});
      return fetch(name, {cache:'no-cache', signal:AbortSignal.timeout(8000)});
    }
  };
})();
