// AddAssignmentModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";

function fetchGraph(token, url = "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50") {
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json());
}

export default function AddAssignmentModal({ open, onClose, onAssign }) {
  const { instance } = useMsal();
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [nextLink, setNextLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // acquire token silently (wrap per your auth helper)
        const acc = instance.getActiveAccount() || (await instance.loginPopup({ scopes: ["User.Read.All"] }));
        const res = await instance.acquireTokenSilent({ account: acc, scopes: ["User.Read.All"] });
        if (!mounted) return;
        setToken(res.accessToken);
        // initial fetch
        const b = await fetchGraph(res.accessToken);
        if (!mounted) return;
        setUsers(b.value || []);
        setNextLink(b["@odata.nextLink"] || null);
      } catch (e) {
        console.error("Fetch users failed:", e);
        // show fallback message or prompt for consent
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, instance]);

  // search (debounced simple)
  useEffect(() => {
    if (!token) return;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const q = encodeURIComponent(query || "");
        const url = query
          ? `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50&$filter=startsWith(displayName,'${q}') or startsWith(userPrincipalName,'${q}') or startsWith(mail,'${q}')`
          : `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50`;
        const b = await fetchGraph(token, url);
        setUsers(b.value || []);
        setNextLink(b["@odata.nextLink"] || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query, token]);

  const loadMore = useCallback(async () => {
    if (!token || !nextLink) return;
    setLoading(true);
    try {
      const b = await fetchGraph(token, nextLink);
      setUsers(prev => [...prev, ...(b.value || [])]);
      setNextLink(b["@odata.nextLink"] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, nextLink]);

  const submit = async () => {
    if (!selected) return alert("Select a user");
    // selected contains user object { id, displayName, mail, userPrincipalName }
    // call your API / create SharePoint item:
    onAssign && onAssign(selected);
    onClose && onClose();
  };

  return !open ? null : (
    <div className="modal">
      <div className="modal-content">
        <h3>Assign Role to User</h3>
        <input placeholder="Search name or email" value={query} onChange={e=>setQuery(e.target.value)} />
        {loading && <div>Loading…</div>}
        <div className="user-list" style={{ maxHeight: 300, overflow: "auto" }}>
          {users.map(u => (
            <div key={u.id} className={`user-row ${selected?.id === u.id ? "selected":""}`}
                 onClick={()=>setSelected(u)}>
              <div className="name">{u.displayName || u.userPrincipalName}</div>
              <div className="email text-xs text-gray-500">{u.mail || u.userPrincipalName}</div>
            </div>
          ))}
          {nextLink && <button onClick={loadMore} className="mt-2">Load more</button>}
          {!users.length && !loading && <div className="text-sm text-gray-500">No results</div>}
        </div>

        <div style={{ marginTop: 12 }} className="buttons">
          <button onClick={submit} className="btn btn-primary">Assign</button>
          <button onClick={onClose} className="btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}
