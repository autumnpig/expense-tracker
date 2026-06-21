/**
 * Persistent category memory: remembers user's manual category assignments
 * keyed by transaction description (交易地点/附言 or 商品说明).
 * Survives page refreshes. Next import auto-applies remembered categories.
 */

const STORAGE_KEY = 'expense_category_memory';

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, string>): void {
  // Prune entries older than 90 days? No — descriptions are stable.
  // But cap at 500 entries to avoid localStorage bloat.
  const entries = Object.entries(data);
  if (entries.length > 500) {
    const kept = entries.slice(-500); // keep most recent
    data = Object.fromEntries(kept);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Look up a remembered category for a description. Returns category name or null. */
export function getRememberedCategory(description: string): string | null {
  const mem = load();
  // Exact match
  if (mem[description]) return mem[description];
  // Try first 20 chars (some descriptions vary in suffix)
  const key = description.slice(0, 20);
  for (const [k, v] of Object.entries(mem)) {
    if (k.startsWith(key)) return v;
  }
  return null;
}

/** Remember a category assignment for a description. */
export function rememberCategory(description: string, categoryId: string): void {
  if (!description || description.length < 2) return;
  const mem = load();
  mem[description] = categoryId;
  save(mem);
}
