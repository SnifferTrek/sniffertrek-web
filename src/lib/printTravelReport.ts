import { formatPdfPrintDate } from "@/lib/pdfCopy";
import { asAppLocale } from "@/lib/localeCopy";

/** Druckdatum – nur in unserer Fusszeile, nicht Browser-Kopfzeile */
export function formatPrintDate(locale = "de"): string {
  return formatPdfPrintDate(locale);
}

const PRINT_DATE_FOOTER_ID = "sniffertrek-print-date-footer";

function waitForPrintImages(): Promise<void> {
  const root =
    document.querySelector<HTMLElement>('.print-doc[data-print-active="1"]') ||
    document.querySelector<HTMLElement>(".print-doc");
  const imgs = root
    ? Array.from(root.querySelectorAll<HTMLImageElement>("img"))
    : [];
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          window.setTimeout(done, 2500);
        })
    )
  ).then(() => undefined);
}

/**
 * Druck ohne Browser-Kopf-/Fusszeile (URL, Titel, Seitenzahl, Datum mit Uhrzeit):
 * isoliertes iframe mit leerem Titel + @page{margin:0} in globals.css.
 * Unser Datum nur als position:fixed unten Mitte.
 */
export function printTravelReport(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  return waitForPrintImages().then(
    () =>
      new Promise((resolve) => {
        const source =
          document.querySelector<HTMLElement>(
            '.print-doc[data-print-active="1"]'
          ) || document.querySelector<HTMLElement>(".print-doc");
        if (!source) {
          window.print();
          resolve();
          return;
        }

        const iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.cssText =
          "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;right:0;bottom:0;";
        document.body.appendChild(iframe);

        const win = iframe.contentWindow;
        const doc = win?.document;
        if (!doc || !win) {
          iframe.remove();
          window.print();
          resolve();
          return;
        }

        const styles = Array.from(
          document.head.querySelectorAll<HTMLElement>(
            'link[rel="stylesheet"], style'
          )
        )
          .map((el) => el.outerHTML)
          .join("");

        const locale = asAppLocale(
          source.getAttribute("data-locale") || document.documentElement.lang || "de"
        );
        const date = formatPrintDate(locale);
        doc.open();
        doc.write(`<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8">`);
        doc.write("<title></title>");
        doc.write(styles);
        doc.write("</head><body>");
        // Blob-URLs aus der Bildschirm-Vorschau sind im iframe unzuverlässig → Proxy-URL
        const html = source.outerHTML.replace(/<img\b[^>]*>/gi, (tag) => {
          if (!/\ssrc="blob:/i.test(tag)) return tag;
          const printSrc = /\sdata-print-src="([^"]*)"/i.exec(tag)?.[1];
          if (!printSrc) return tag;
          return tag.replace(/\ssrc="blob:[^"]*"/i, ` src="${printSrc}"`);
        });
        doc.write(html);
        doc.write(
          `<div id="${PRINT_DATE_FOOTER_ID}" aria-hidden="true">${date}</div>`
        );
        doc.write("</body></html>");
        doc.close();

        const cleanup = () => {
          iframe.remove();
          win.removeEventListener("afterprint", cleanup);
          resolve();
        };
        win.addEventListener("afterprint", cleanup);

        // Stylesheets + Kartenbilder laden lassen
        window.setTimeout(() => {
          win.focus();
          win.print();
          window.setTimeout(() => {
            if (document.body.contains(iframe)) cleanup();
          }, 60_000);
        }, 400);
      })
  );
}
