export const SMART_PAGES_MAX_PHOTOS_PER_PAGE = 6;
export const SMART_PAGES_MAX_PAGES = 12;
export const SMART_PAGES_MAX_PHOTOS = 24;

/** A4 pt — same as pdfService photo pages. */
export const SMART_PAGE_W = 595.28;
export const SMART_PAGE_H = 841.89;
export const SMART_PAGE_M = 50;
export const SMART_PAGE_GAP = 10;
const CONTENT_W = SMART_PAGE_W - 2 * SMART_PAGE_M;
const AVAILABLE_H = SMART_PAGE_H - 2 * SMART_PAGE_M;

export type SmartLayoutItem = { index: number; aspect: number };
export type SmartLayoutRow = { kind: "landscape" | "portrait"; items: SmartLayoutItem[] };
export type SmartLayoutPage = { rows: SmartLayoutRow[] };

export function smartPagesCount(photoCount: number, targetPages?: number): number {
 const requested = Math.max(1, Math.min(SMART_PAGES_MAX_PAGES, Math.floor(Number(targetPages) || 1)));
 if (photoCount <= 0) return requested;
 const minPagesNeeded = Math.ceil(photoCount / SMART_PAGES_MAX_PHOTOS_PER_PAGE);
 return Math.max(requested, minPagesNeeded);
}

/** Round-robin buckets, same order as PDF Smart Pages. */
export function distributeSmartPageIndices(photoCount: number, targetPages?: number): number[][] {
 const pages = smartPagesCount(photoCount, targetPages);
 const buckets: number[][] = Array.from({ length: pages }, () => []);
 for (let i = 0; i < photoCount; i++) buckets[i % pages].push(i);
 return buckets;
}

export function isSmartLandscape(aspect: number): boolean {
 return aspect >= 1.05;
}

export function buildSmartRows(items: SmartLayoutItem[], portraitPerRow: number): SmartLayoutRow[] {
 const rows: SmartLayoutRow[] = [];
 let pBuf: SmartLayoutItem[] = [];
 for (const a of items) {
  if (isSmartLandscape(a.aspect)) {
   if (pBuf.length > 0) {
    rows.push({ kind: "portrait", items: pBuf });
    pBuf = [];
   }
   rows.push({ kind: "landscape", items: [a] });
  } else {
   pBuf.push(a);
   if (pBuf.length >= portraitPerRow) {
    rows.push({ kind: "portrait", items: pBuf });
    pBuf = [];
   }
  }
 }
 if (pBuf.length > 0) rows.push({ kind: "portrait", items: pBuf });
 return rows;
}

export function estimateSmartRowHeight(row: SmartLayoutRow): number {
 if (row.kind === "landscape") {
  const a = row.items[0];
  return Math.max(130, Math.min(300, CONTENT_W / Math.max(1.05, a.aspect)));
 }
 const cols = row.items.length;
 const cellW = (CONTENT_W - SMART_PAGE_GAP * (cols - 1)) / cols;
 const avgAspect = row.items.reduce((s, it) => s + it.aspect, 0) / Math.max(1, cols);
 return Math.max(170, Math.min(320, cellW / Math.max(0.55, avgAspect)));
}

function packRowsOntoPages(rows: SmartLayoutRow[]): SmartLayoutPage[] {
 const pages: SmartLayoutPage[] = [];
 let idx = 0;
 while (idx < rows.length) {
  const pageRows: SmartLayoutRow[] = [];
  let usedH = 0;
  while (idx < rows.length) {
   const h = estimateSmartRowHeight(rows[idx]);
   const nextUsed = pageRows.length === 0 ? h : usedH + SMART_PAGE_GAP + h;
   if (nextUsed > AVAILABLE_H && pageRows.length > 0) break;
   pageRows.push(rows[idx]);
   usedH = nextUsed;
   idx += 1;
  }
  pages.push({ rows: pageRows });
 }
 return pages;
}

/** Pages as the PDF draws them: round-robin buckets, then orientation rows, then height packing. */
export function buildSmartPhotoPages(items: SmartLayoutItem[], targetPages?: number): SmartLayoutPage[] {
 if (items.length === 0) return [{ rows: [] }];
 const buckets = distributeSmartPageIndices(items.length, targetPages);
 const pages: SmartLayoutPage[] = [];
 for (const idxs of buckets) {
  if (idxs.length === 0) continue;
  const bucketItems = idxs.map((i) => items[i]);
  const portraitRatio =
   bucketItems.filter((a) => !isSmartLandscape(a.aspect)).length / Math.max(1, bucketItems.length);
  const portraitPerRow = portraitRatio >= 0.6 ? 3 : 2;
  pages.push(...packRowsOntoPages(buildSmartRows(bucketItems, portraitPerRow)));
 }
 return pages.length ? pages : [{ rows: [] }];
}

export type SmartPageCellBox = {
 item: SmartLayoutItem;
 topPct: number;
 leftPct: number;
 widthPct: number;
 heightPct: number;
};

/** Absolute A4 boxes matching pdfService drawRowsPage (incl. fit-to-page scale). */
export function smartPageCellBoxes(page: SmartLayoutPage): SmartPageCellBox[] {
 if (page.rows.length === 0) return [];
 const estimated = page.rows.map(estimateSmartRowHeight);
 const totalEstimated =
  estimated.reduce((s, h) => s + h, 0) + SMART_PAGE_GAP * Math.max(0, page.rows.length - 1);
 const scale = totalEstimated > 0 ? Math.min(1, AVAILABLE_H / totalEstimated) : 1;
 const boxes: SmartPageCellBox[] = [];
 let y = SMART_PAGE_M;
 page.rows.forEach((row, idx) => {
  const rowH = estimated[idx] * scale;
  if (row.kind === "landscape") {
   const item = row.items[0];
   boxes.push({
    item,
    topPct: (y / SMART_PAGE_H) * 100,
    leftPct: (SMART_PAGE_M / SMART_PAGE_W) * 100,
    widthPct: (CONTENT_W / SMART_PAGE_W) * 100,
    heightPct: (rowH / SMART_PAGE_H) * 100,
   });
  } else {
   const cols = row.items.length;
   const cellW = (CONTENT_W - SMART_PAGE_GAP * (cols - 1)) / cols;
   row.items.forEach((item, c) => {
    boxes.push({
     item,
     topPct: (y / SMART_PAGE_H) * 100,
     leftPct: ((SMART_PAGE_M + c * (cellW + SMART_PAGE_GAP)) / SMART_PAGE_W) * 100,
     widthPct: (cellW / SMART_PAGE_W) * 100,
     heightPct: (rowH / SMART_PAGE_H) * 100,
    });
   });
  }
  y += rowH + SMART_PAGE_GAP;
 });
 return boxes;
}
