/** Beschriftung unter Fotos im PDF-Reisebericht. */
export const PDF_PHOTO_CAPTION_MAX_LENGTH = 30;

export function normalizePdfPhotoCaption(value: string): string {
 const trimmed = value.trim();
 if (!trimmed) return "";
 if (trimmed.length <= PDF_PHOTO_CAPTION_MAX_LENGTH) return trimmed;
 return `${trimmed.slice(0, PDF_PHOTO_CAPTION_MAX_LENGTH - 1)}…`;
}
