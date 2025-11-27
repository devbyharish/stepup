// src/pages/Students/List.jsx
import React, { useEffect, useState } from "react";
import { createGetToken } from "../../auth/msal";
import { createGraphClient } from "../../graph/client";
import { listItems } from "../../utils/graph";
import { SITE_ID, LISTS } from "../../config/sharepoint"; // <-- fixed path (two levels up)
import Table from "../../components/Table";
import { useMsal } from "@azure/msal-react";

export default function StudentsList({ onOpenStudent }) {
  const { instance } = useMsal();
  const [client, setClient] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    if (!instance) return;
    const g = createGetToken(instance);
    setClient(createGraphClient(g));
  }, [instance]);

  const load = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const listId = LISTS.students;
      if (!listId) throw new Error("students list not configured in LISTS");
      // pass SITE_ID (was undefined before)
      const res = await listItems(client, SITE_ID, listId, "&$top=500");
      setRows((res.value || []).map(r => r));
    } catch (e) {
      console.error("StudentsList load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=> { if (client) load(); }, [client]);

  const columns = [
    { key: "Title", label: "Name", render: (r)=> r.fields?.Title || r.fields?.FullName || "—" },
    { key: "Class", label: "Class", render: (r)=> r.fields?.Class || "—" },
    { key: "Section", label: "Section", render: (r)=> r.fields?.Section || "—" },
    { key: "ParentName", label: "Parent", render: (r)=> r.fields?.ParentName || "—" },
    { key: "Status", label: "Status", render: (r)=> r.fields?.Status || "—" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Students</h2>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-xl px-3 py-2 border">Refresh</button>
        </div>
      </div>

      {loading ? <div>Loading…</div> : <Table columns={columns} rows={rows} actions={(r) => (
        <div className="flex gap-2 justify-end">
          <button className="rounded-md px-3 py-1 border text-xs" onClick={() => onOpenStudent && onOpenStudent(r.id)}>Open</button>
        </div>
      )} />}
    </div>
  );
}
