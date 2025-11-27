// src/pages/StudentsManage.jsx
import React, { useEffect, useState } from "react";
import Page from "../components/Page";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import DateInput from "../components/ui/DateInput";
import { fetchItems, createItem, updateItem, deleteItem } from "../lib/graphClient";

/*
  StudentsManage:
  - List students
  - Create / Edit via inline modal
  - Delete (confirm)
  - CSV import (simple)
*/

function emptyForm() {
  return { Title: "", StudentId: "", Class: "", Section: "", DOB: "", ParentName: "", ParentPhone: "", EnrolmentDate: "", Status: "Active", Photo: "" };
}

export default function StudentsManage({ role }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {id, ...fields}
  const [form, setForm] = useState(emptyForm());
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const items = await fetchItems("students");
      setStudents(items || []);
    } catch (e) {
      console.error("Failed to load students", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ ...s });
  }

  async function save() {
    try {
      if (editing && editing.id) {
        await updateItem("students", editing.id, form);
      } else {
        await createItem("students", form);
      }
      await load();
      setEditing(null);
      setForm(emptyForm());
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed: " + (e.message || e));
    }
  }

  async function remove(id) {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    try {
      await deleteItem("students", id);
      await load();
    } catch (e) {
      console.error("Delete failed", e);
      alert("Delete failed: " + (e.message || e));
    }
  }

  // CSV import: expects header with names matching fields: Title,StudentId,Class,Section,DOB,ParentName,ParentPhone,EnrolmentDate,Status
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim());
      const obj = {};
      for (let i = 0; i < headers.length; i++) obj[headers[i]] = cols[i] ?? "";
      return obj;
    });
    return rows;
  }

  async function handleCSVFile(file) {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) { alert("No rows found in CSV"); return; }
      // Basic mapping & create sequentially (could be batched)
      for (const r of rows) {
        const payload = {
          Title: r.Title || r.Name || r.StudentName || "",
          StudentId: r.StudentId || r.Id || "",
          Class: r.Class || "",
          Section: r.Section || "",
          DOB: r.DOB || r.DateOfBirth || "",
          ParentName: r.ParentName || r.Parent || "",
          ParentPhone: r.ParentPhone || r.ParentContact || "",
          EnrolmentDate: r.EnrolmentDate || "",
          Status: r.Status || "Active"
        };
        try { await createItem("students", payload); } catch(e){ console.warn("Import row failed", e); }
      }
      await load();
      alert(`Imported ${rows.length} rows (attempted)`);
    } catch (e) {
      console.error("CSV import failed", e);
      alert("CSV import failed: " + (e.message || e));
    } finally {
      setImporting(false);
    }
  }

  // quick permission check
  const canManage = role === "opsadmin" || role === "sysadmin";

  return (
    <Page title="Manage Students" subtitle="Create, edit, delete or bulk import students" actions={canManage && <Button onClick={openCreate}>+ Add Student</Button>}>
      <div className="p-4">
        <div className="mb-4 flex items-center gap-3">
          {canManage && (
            <>
              <label className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)]">CSV Import</span>
                <input type="file" accept=".csv" onChange={e => handleCSVFile(e.target.files?.[0])} className="ml-2" />
              </label>
              {importing && <div className="text-sm text-[var(--muted)]">Importing...</div>}
            </>
          )}
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-[var(--brand-navy)] text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Student ID</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Parent</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-4">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="5" className="p-4">No students</td></tr>
              ) : (
                students.map(s => (
                  <tr className="bg-white border-b" key={s.id}>
                    <td className="p-3">{s.Title}</td>
                    <td className="p-3">{s.StudentId}</td>
                    <td className="p-3">{s.Class}</td>
                    <td className="p-3">{s.ParentName} {s.ParentPhone ? `• ${s.ParentPhone}` : ""}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <a className="px-3 py-1 rounded-md border text-sm" href={`#/students/${s.id}`}>View</a>
                        {canManage && <button onClick={() => openEdit(s)} className="px-3 py-1 rounded-md border text-sm">Edit</button>}
                        {canManage && <button onClick={() => remove(s.id)} className="px-3 py-1 rounded-md border text-sm text-red-600">Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal-ish section */}
        {(editing !== null || form) && canManage && (
          <div className="mt-6 bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold mb-3">{editing ? "Edit Student" : "Add Student"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Name" value={form.Title} onChange={v => setForm({ ...form, Title: v })} />
              <Input label="Student ID" value={form.StudentId} onChange={v => setForm({ ...form, StudentId: v })} />
              <Input label="Class" value={form.Class} onChange={v => setForm({ ...form, Class: v })} />
              <Input label="Section" value={form.Section} onChange={v => setForm({ ...form, Section: v })} />
              <DateInput label="DOB" value={form.DOB} onChange={v => setForm({ ...form, DOB: v })} />
              <Input label="Parent Name" value={form.ParentName} onChange={v => setForm({ ...form, ParentName: v })} />
              <Input label="Parent Phone" value={form.ParentPhone} onChange={v => setForm({ ...form, ParentPhone: v })} />
              <DateInput label="Enrolment Date" value={form.EnrolmentDate} onChange={v => setForm({ ...form, EnrolmentDate: v })} />
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={save}>Save</Button>
              <button onClick={() => { setEditing(null); setForm(emptyForm()); }} className="px-3 py-2 border rounded">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
