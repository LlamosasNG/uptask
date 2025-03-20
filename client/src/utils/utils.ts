export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
