"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  value: string;
  onChange: (code: string, title?: string) => void;
  required?: boolean;
}

export function NaicsCombobox({ value, onChange, required }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = trpc.establishments.naicsSearch.useQuery(
    { q: query },
    { enabled: query.length >= 2, keepPreviousData: true }
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  function select(code: string, title: string) {
    setQuery(code);
    onChange(code, title);
    setOpen(false);
  }

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 2 && setOpen(true)}
          required={required}
          minLength={4}
          maxLength={6}
          placeholder="e.g. 3321 or Fabricated Metal"
          className="form-input pr-8"
          autoComplete="off"
        />
        {isFetching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {results.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                onMouseDown={() => select(item.code, item.title)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-mono font-semibold text-blue-600 shrink-0 w-10">{item.code}</span>
                <span className="text-slate-700 truncate">{item.title}</span>
                <span className="ml-auto flex gap-1 shrink-0">
                  {item.isAppendixASubpartB && (
                    <span className="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">Exempt</span>
                  )}
                  {item.isAppendixBSubpartE && (
                    <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">ITA</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && !isFetching && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-3 text-sm text-slate-500">
          No matching NAICS codes found. You can still enter the code manually.
        </div>
      )}
    </div>
  );
}
