function normalizeSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

export function buildPdfFilename(prefix: string, eventName: string, eventDate?: Date | string | null) {
  const safePrefix = normalizeSegment(prefix) || "arquivo";
  const safeEventName = normalizeSegment(eventName) || "evento";

  let dateSuffix = "";
  if (eventDate) {
    const parsed = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
    if (!Number.isNaN(parsed.getTime())) {
      dateSuffix = parsed.toISOString().slice(0, 10);
    }
  }

  return `${safePrefix}-${safeEventName}${dateSuffix ? `-${dateSuffix}` : ""}.pdf`;
}
