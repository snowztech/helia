export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function withNext(path: string, next: string | null): string {
  if (!next) return path;
  const params = new URLSearchParams({ next });
  return `${path}?${params.toString()}`;
}
