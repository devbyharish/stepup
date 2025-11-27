// src/config/sharepoint.js
// Exports simple constants read from Vite env.
// Ensure you set VITE_SP_SITE_ID and VITE_LISTS_JSON in .env.local

export const SITE_ID = import.meta.env.VITE_SP_SITE_ID || "";
export const LISTS = (() => {
  try {
    return JSON.parse(import.meta.env.VITE_LISTS_JSON || "{}");
  } catch (e) {
    console.warn("VITE_LISTS_JSON parse failed:", e);
    return {};
  }
})();
