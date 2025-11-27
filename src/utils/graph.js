// src/utils/graph.js
// Helpers for interacting with SharePoint lists via Microsoft Graph
// Expects `client` from createGraphClient(getTokenFn)
// All functions accept client, siteId, listId.

// listItems(client, siteId, listId, query)
export async function listItems(client, siteId, listId, query = "") {
  if (!client) throw new Error("Graph client required");
  if (!siteId) throw new Error("siteId required");
  if (!listId) throw new Error("listId required");

  const site = `/sites/${encodeURIComponent(siteId)}`;
  const url = `${site}/lists/${listId}/items${query ? `?${query.replace(/^\?/, "")}` : ""}`;
  return client.api ? client.api(url).get() : client.get(url);
}

// getItem(client, siteId, listId, itemId) - expands fields
export async function getItem(client, siteId, listId, itemId) {
  if (!client) throw new Error("Graph client missing");
  if (!siteId) throw new Error("siteId required");
  if (!listId) throw new Error("listId required");
  if (!itemId) throw new Error("itemId required");

  const url = `/sites/${encodeURIComponent(siteId)}/lists/${listId}/items/${itemId}?expand=fields`;
  return client.api ? client.api(url).get() : client.get(url);
}

// createItem(client, siteId, listId, fields)
// IMPORTANT: Graph expects { fields: { InternalName: value } }
export async function createItem(client, siteId, listId, fields = {}) {
  if (!client) throw new Error("Graph client required");
  if (!siteId) throw new Error("siteId required");
  if (!listId) throw new Error("listId required");

  const url = `/sites/${encodeURIComponent(siteId)}/lists/${listId}/items`;
  const body = { fields };
  console.log("graph.js: ");
  console.log(fields);
  try {
    return client.api ? client.api(url).post(body) : client.post(url, body);
  } catch (e) {
    // attach Graph response if present for easier debugging
    console.error("createItem error", e.response || e);
    throw e;
  }
}

// updateItem(client, siteId, listId, itemId, fields)
export async function updateItem(client, siteId, listId, itemId, fields = {}) {
  if (!client) throw new Error("Graph client required");
  if (!siteId || !listId || !itemId) throw new Error("siteId, listId and itemId required");
  const url = `/sites/${encodeURIComponent(siteId)}/lists/${listId}/items/${itemId}/fields`;
  return client.api ? client.api(url).patch(fields) : client.patch(url, fields);
}

// deleteItem(client, siteId, listId, itemId)
export async function deleteItem(client, siteId, listId, itemId) {
  if (!client) throw new Error("Graph client required");
  if (!siteId || !listId || !itemId) throw new Error("siteId, listId and itemId required");
  const url = `/sites/${encodeURIComponent(siteId)}/lists/${listId}/items/${itemId}`;
  return client.api ? client.api(url).delete() : client.delete(url);
}
