export type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean | null | undefined>;

/** Tiny clsx-style class joiner (no dependency). */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const push = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(push);
    } else {
      for (const [key, on] of Object.entries(value)) if (on) out.push(key);
    }
  };
  inputs.forEach(push);
  return out.join(' ');
}
