import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Get a Lucide icon by name. Returns HelpCircle as fallback.
 * Uses double-cast to work around TS strictness with lucide-react namespace import.
 */
export function getLucideIcon(name: string): LucideIcon {
  const icons = Icons as unknown as Record<string, LucideIcon>;
  // Direct match (PascalCase or single-word lowercase like 'bus', 'star', 'gift')
  if (icons[name]) return icons[name];
  // kebab-case → PascalCase: 'utensils-crossed' → 'UtensilsCrossed'
  const pascal = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  if (icons[pascal]) return icons[pascal];
  // Capitalize single word: 'bus' → 'Bus' (handles remaining cases)
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  if (icons[capitalized]) return icons[capitalized];
  return Icons.HelpCircle;
}
