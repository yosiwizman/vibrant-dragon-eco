export function appleMapsLink(lat: number, lon: number, name?: string) {
  const q = name ? `&q=${encodeURIComponent(name)}` : "";
  return `https://maps.apple.com/?daddr=${lat},${lon}${q}`;
}

export function openAppleMaps(lat: number, lon: number, name?: string) {
  const url = appleMapsLink(lat, lon, name);
  window.open(url, "_blank");
}