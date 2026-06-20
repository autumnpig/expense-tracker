import React, { useState, useRef, useEffect } from 'react';
import { useAccountStore } from '@/stores/accountStore';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

interface AccountSelectorProps {
  value: string; // accountId
  onChange: (accountId: string) => void;
  placeholder?: string;
}

function getIcon(name: string): LucideIcon {
  const Icon = (Icons as Record<string, LucideIcon>)[name];
  return Icon || Icons.HelpCircle;
}

export default function AccountSelector({ value, onChange, placeholder = '选择账户' }: AccountSelectorProps) {
  const accounts = useAccountStore((s) => s.accounts);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = accounts.find((a) => a.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-input bg-background text-sm hover:bg-muted/50 transition-colors"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            {React.createElement(getIcon(selected.icon), { size: 18 })}
            <span className="font-medium">{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown size={16} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onChange(a.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors ${
                value === a.id ? 'text-primary font-medium' : ''
              }`}
            >
              {React.createElement(getIcon(a.icon), { size: 18 })}
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

