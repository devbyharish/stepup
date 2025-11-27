// src/components/Header.jsx
import React from "react";

export default function Header({ breadcrumb = ["Home >","Students Directory"], children }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-10">
      <div className="flex items-center text-gray-500 text-sm">
        <span className="hover:text-[var(--brand-primary)] cursor-pointer">{breadcrumb[0]}</span>
        <i className="fas fa-chevron-right text-xs mx-2"></i>
        <span className="text-gray-800 font-semibold">{breadcrumb[1]}</span>
      </div>

      <div className="flex items-center gap-3">
        {children}
      </div>
    </header>
  );
}
