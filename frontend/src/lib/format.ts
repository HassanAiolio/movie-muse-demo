export function yearOf(date?: string | null) {
  const year = parseInt(String(date || '').slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest.toString().padStart(2, '0')}m` : `${rest}m`;
}

export function formatRating(rating?: number | null) {
  return rating ? rating.toFixed(1) : null;
}
