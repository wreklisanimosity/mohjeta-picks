// Full public snapshots are data requests, not website deployments.
(function () {
  let configuration;
  const last = new Map();
  async function config() {
    if (!configuration) configuration = fetch('live-data-config.json', {cache:'no-cache', signal:AbortSignal.timeout(8000)})
      .then(r => { if (!r.ok) throw Error('No live feed'); return r.json(); })
      .catch(e => { configuration = null; throw e; });
    return configuration;
  }
  window.fetchPublicSnapshot = async function(name) {
    if (!['data.json','ratings.json','stamps.json'].includes(name)) throw Error('Unknown snapshot');
    try {
      const c = await config();
      const r = await fetch(c.url + '/rest/v1/public_snapshots?select=data,updated_at&name=eq.' + encodeURIComponent(name),
        {headers:{apikey:c.anon_key}, cache:'no-store', signal:AbortSignal.timeout(8000)});
      if (!r.ok) throw Error('Live feed unavailable');
      const rows = await r.json(), row = rows[0];
      if (!row || !row.data || typeof row.data !== 'object' || Array.isArray(row.data)) throw Error('Missing snapshot');
      const body = JSON.stringify(row.data);
      const response = new Response(body, {headers:{'Content-Type':'application/json','ETag':row.updated_at}});
      last.set(name, response.clone());
      return response;
    } catch (e) {
      // Never replace a good live snapshot with an older GitHub copy mid-session.
      if (last.has(name)) return last.get(name).clone();
      return fetch(name, {cache:'no-cache', signal:AbortSignal.timeout(8000)});
    }
  };
})();
