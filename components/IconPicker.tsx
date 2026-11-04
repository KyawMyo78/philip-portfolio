"use client";

import React, { useEffect, useState } from 'react';

import { ICON_LIST } from './icon-data';
import IconPreview from './IconPreview';

export default function IconPicker({ value, onChange }: { value?: string; onChange: (key: string) => void }) {
  const [query, setQuery] = useState('');
  const [lib, setLib] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import('lucide-react').then((m) => { if (mounted) setLib(m); }).catch(() => { if (mounted) setLib(null); });
    return () => { mounted = false; };
  }, []);

  const filtered = ICON_LIST.filter(i => i.key.includes(query.toLowerCase()) || (i.label || '').toLowerCase().includes(query.toLowerCase()) || i.componentName.toLowerCase().includes(query.toLowerCase()));

  // Deduplicate icons by key to avoid duplicate key errors
  const uniqueIcons = filtered.reduce((acc, icon) => {
    if (!acc.find(item => item.key === icon.key)) {
      acc.push(icon);
    }
    return acc;
  }, [] as typeof ICON_LIST);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <input
          placeholder="Search icons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 border rounded flex-1"
        />
        <div className="p-2 border rounded bg-white w-36 text-sm text-gray-700">Selected: {value || 'none'}</div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-3 max-h-44 overflow-y-auto">
        {uniqueIcons.map(icon => {
          const isSelected = value === icon.key;
          return (
            <button
              key={icon.key}
              onClick={() => onChange(icon.key)}
              className={`p-2 rounded border ${isSelected ? 'border-primary-600 bg-primary-50' : 'bg-white border-gray-200'} flex flex-col items-center justify-center text-xs`}
              title={icon.label || icon.key}
            >
              <div className="w-6 h-6 mb-1">
                <IconPreview name={icon.key} className="w-6 h-6" />
              </div>
              <div className="truncate w-full">{icon.label || icon.key}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
