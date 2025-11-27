// src/components/ListControls/SearchBar.jsx
import React, { useEffect, useState } from "react";

export default function SearchBar({ value = "", onChange, placeholder="Search...", debounceMs = 300 }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => onChange && onChange(local), debounceMs);
    return () => clearTimeout(t);
  }, [local, debounceMs, onChange]);
  return (
    <input
      aria-label="search"
      className="border rounded px-3 py-2 w-full md:w-80"
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}
