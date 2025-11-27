// src/hooks/useListControls.js
import { useEffect, useMemo, useState } from "react";

export default function useListControls(initial = {}) {
  const { search: s0 = "", filters: f0 = {}, sortBy: sb0 = "Title", sortDir: sd0 = "asc", debounceMs = 300 } = initial;
  const [search, setSearch] = useState(s0);
  const [filters, setFilters] = useState(f0);
  const [sortBy, setSortBy] = useState(sb0);
  const [sortDir, setSortDir] = useState(sd0);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [search, debounceMs]);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };
  const resetControls = () => { setSearch(s0); setFilters(f0); setSortBy(sb0); setSortDir(sd0); };

  return useMemo(() => ({
    search, setSearch, debouncedSearch,
    filters, setFilters, setFilter,
    sortBy, setSortBy, sortDir, setSortDir, toggleSort,
    resetControls
  }), [search, debouncedSearch, filters, sortBy, sortDir]);
}
