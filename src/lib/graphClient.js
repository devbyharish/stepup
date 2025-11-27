// src/lib/graphClient.js

//
// ───────────────────────────────────────────────────────────
//   Utility Helpers
// ───────────────────────────────────────────────────────────
//

function debugLog(...args) {
  if (window && window.STEPUP_DEBUG && window.STEPUP_DEBUG.verbose) {
    console.debug(...args);
  }
}

function siteEncoded() {
  if (!window.SITE_ID) throw new Error("siteId missing (window.SITE_ID)");
  return encodeURIComponent(window.SITE_ID);
}

async function getTokenOrThrow() {
  if (!window.auth || typeof window.auth.getToken !== "function") {
    throw new Error("Auth helper missing: window.auth.getToken()");
  }
  const t = await window.auth.getToken();
  if (!t || typeof t !== "string" || t.split(".").length < 3) {
    throw new Error("Invalid token returned by window.auth.getToken()");
  }
  return t;
}

async function rawFetch(path, opts = {}) {
  const token = await getTokenOrThrow();
  const base = `https://graph.microsoft.com/v1.0/sites/${siteEncoded()}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(base + path, { headers, ...opts });
  const bodyText = await res.text();

  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch (e) {
    body = bodyText;
  }

  if (!res.ok) {
    const err = new Error(
      `Graph ${res.status}: ${JSON.stringify(body) || res.statusText}`
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

//
// ───────────────────────────────────────────────────────────
//   Column Fetching (Needed for Safe Patching)
// ───────────────────────────────────────────────────────────
//

export async function fetchListColumns(listKey) {
  const listId = window.LISTS?.[listKey];
  if (!listId) throw new Error(`fetchListColumns: listId missing for ${listKey}`);

  const j = await rawFetch(`/lists/${listId}/columns`);
  return j.value || [];
}

//
// ───────────────────────────────────────────────────────────
//   Reads
// ───────────────────────────────────────────────────────────
//

export async function fetchItems(listKey, query = "") {
  const listId = window.LISTS?.[listKey];
  if (!listId) throw new Error(`fetchItems: listId missing for ${listKey}`);

  const j = await rawFetch(`/lists/${listId}/items?$expand=fields${query}`);
  return (j.value || []).map((it) => ({
    id: it.id,
    ...(it.fields || {}),
  }));
}

export async function fetchItem(listKey, itemId) {
  const listId = window.LISTS?.[listKey];
  if (!listId) throw new Error(`fetchItem: listId missing for ${listKey}`);

  const j = await rawFetch(`/lists/${listId}/items/${itemId}?$expand=fields`);
  return { id: j.id, ...(j.fields || {}) };
}

//
// ───────────────────────────────────────────────────────────
//   Create (Safe)
// ───────────────────────────────────────────────────────────
//

export async function createItem(listKey, fieldsObj) {
  const listId = window.LISTS?.[listKey];
  if (!listId) throw new Error(`createItem: listId missing for ${listKey}`);

  // blacklist everything that SharePoint will reject
  const blacklist = new Set([
    "id",
    "ID",
    "Id",
    "Modified",
    "Created",
    "Author",
    "Editor",
    "createdDateTime",
    "lastModifiedDateTime",
    "odata.etag",
    "fields",
    "_etag",
  ]);

  const cleaned = {};
  Object.keys(fieldsObj || {}).forEach((k) => {
    if (!blacklist.has(k)) cleaned[k] = fieldsObj[k];
  });

  return rawFetch(`/lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify({ fields: cleaned }),
  });
}

//
// ───────────────────────────────────────────────────────────
//   Delete
// ───────────────────────────────────────────────────────────
//

export async function deleteItem(listKey, itemId) {
  const listId = window.LISTS?.[listKey];
  if (!listId) throw new Error(`deleteItem: listId missing for ${listKey}`);

  await rawFetch(`/lists/${listId}/items/${itemId}`, { method: "DELETE" });
  return true;
}

//
// ───────────────────────────────────────────────────────────
//   Update (Fully Safe Whitelist Logic)
// ───────────────────────────────────────────────────────────
//

// Replace existing updateItem with this version
export async function updateItem(listKey, itemId, raw) {
  const listId = window.LISTS?.[listKey];
  if (!listId) throw new Error(`updateItem: listId missing for ${listKey}`);

  // 1) try to get column metadata for whitelist
  let cols = [];
  try {
    cols = await fetchListColumns(listKey); // returns array of column objects
  } catch (err) {
    console.warn("updateItem: fetchListColumns failed, will fallback to blacklist", err);
    cols = [];
  }

  // Build allowed set from column metadata but exclude readOnly/hidden/system columns
  const extraBlacklist = new Set([
    "Modified", "Created", "Author", "Editor",
    "AuthorLookupId", "EditorLookupId", "ID", "Id", "odata.etag", "_etag"
  ]);

  const allowed = new Set();
  if (cols && cols.length > 0) {
    cols.forEach(c => {
      // Column objects from Graph usually have properties like: name (internal), displayName, readOnly, hidden
      const internal = c.name || c.internalName || c.internalColumnName;
      const readOnly = !!c.readOnly || !!c.readOnlyForAdd || !!c.readOnlyForEdit;
      const hidden = !!c.hidden;
      if (!internal) return;
      if (readOnly) return;   // skip read-only columns
      if (hidden) return;     // skip hidden/systemish columns
      if (extraBlacklist.has(internal)) return; // skip known metadata
      allowed.add(internal);
    });
  }

  // fallback blacklist regex to filter common system/read-only names if columns couldn't be fetched
  const fallbackBlacklistRegex = /(author|editor|created|modified|odata|etag|_etag|lookupid|lookup|id)$/i;

  // 2) build the patch object using allowed set (or fallback)
  const patch = {};
  Object.keys(raw || {}).forEach(k => {
    if (/^id$/i.test(k)) return; // never patch id
    const v = raw[k];
    if (v !== null && typeof v === "object") return; // skip nested objects (lookups, people)

    if (allowed.size > 0) {
      if (allowed.has(k)) patch[k] = v;
      // else skip
    } else {
      // fallback: allow everything that does not match blacklist pattern
      if (fallbackBlacklistRegex.test(k)) return;
      patch[k] = v;
    }
  });

  if (Object.keys(patch).length === 0) {
    throw new Error(`updateItem: No valid fields to update for item ${itemId}`);
  }

  // debug output to confirm patch payload; enable via window.STEPUP_DEBUG = { verbose: true }
  if (window && window.STEPUP_DEBUG && window.STEPUP_DEBUG.verbose) {
    console.debug("updateItem: final PATCH payload:", patch);
    console.debug("updateItem: allowed columns from metadata:", Array.from(allowed).slice(0,200));
  }

  return rawFetch(`/lists/${listId}/items/${itemId}/fields`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}
