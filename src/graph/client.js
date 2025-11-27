// src/graph/client.js
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export function createGraphClient(getTokenFn) {
  if (!getTokenFn || typeof getTokenFn !== "function") {
    throw new Error("createGraphClient requires a getToken() function");
  }

  // helper to build full URL when caller passes a path (like "/sites/...")
  function normalizeUrl(url) {
    if (!url) return GRAPH_BASE;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!url.startsWith("/")) url = `/${url}`;
    return `${GRAPH_BASE}${url}`;
  }

  // low-level request helper
  async function fetchWithToken(fullUrl, opts = {}) {
    const token = await getTokenFn();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(opts.headers || {})
    };
    const res = await fetch(fullUrl, { ...opts, headers });
    const text = await res.text().catch(() => null);
    const json = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

    if (!res.ok) {
      const err = new Error(json?.error?.message || `Graph ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json;
  }

  const client = {
    _getToken: getTokenFn,
    getToken: getTokenFn, // backward compat

    // keep your existing direct helpers (they accept full url or path)
    async get(url, opts = {}) {
      const full = normalizeUrl(url);
      return fetchWithToken(full, { method: "GET", ...opts });
    },

    async post(url, body, opts = {}) {
      const full = normalizeUrl(url);
      return fetchWithToken(full, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      });
    },

    async patch(url, body, opts = {}) {
      const full = normalizeUrl(url);
      return fetchWithToken(full, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      });
    },

    async delete(url, opts = {}) {
      const full = normalizeUrl(url);
      return fetchWithToken(full, { method: "DELETE", ...opts });
    },

    // === NEW: api(path) wrapper expected by your components ===
    api(path) {
      const baseUrl = normalizeUrl(path);
      return {
        get: async () => client.get(baseUrl),
        post: async (body) => client.post(baseUrl, body),
        patch: async (body) => client.patch(baseUrl, body),
        delete: async () => client.delete(baseUrl),
      };
    }
  };

  return client;
}
