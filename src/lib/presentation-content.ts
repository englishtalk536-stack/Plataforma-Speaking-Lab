const emptyPlaceholders = new Set(['na', 'n/a', 'nq', 'null', 'undefined', '-']);

export function displayableText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || emptyPlaceholders.has(trimmed.toLowerCase())) return null;

  return trimmed;
}