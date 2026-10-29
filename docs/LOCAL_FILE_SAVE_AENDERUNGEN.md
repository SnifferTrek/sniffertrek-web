# Lokale Reisedatei (Variante B) – Änderungsprotokoll

Stand: 2026-03-29

## Zweck

Reisen können als **`.sniffertrek.json`** auf dem Rechner gespeichert werden. Mit **File System Access API** (Chrome/Edge) wird dieselbe Datei nach Änderungen **automatisch überschrieben**. Safari: oft **«Datei verbinden»** nach Tab-Neustart nötig; Fallback **Download** ohne dauerhaften Handle.

Browser-`localStorage`/Sidecar bleiben **Arbeitskopie**; die verknüpfte Datei ist die **sichere Kopie** für Nutzer mit Datei-Link.

## Neue Dateien

| Datei | Rolle |
|--------|--------|
| `src/lib/tripLocalFileDocument.ts` | JSON-Format, `hydrateTripMedia` beim Export, Parse/Import, Download-Fallback |
| `src/lib/tripLocalFileAccess.ts` | File System Access, IndexedDB für `FileSystemFileHandle`, Auto-Write |
| `src/components/TripLocalFileBar.tsx` | Banner, Status, Buttons im Planer |
| `docs/LOCAL_FILE_SAVE_AENDERUNGEN.md` | Dieses Dokument |

## Geänderte Dateien (2026-03-29 Ergänzung)

| Datei | Änderung |
|--------|-----------|
| `src/app/[locale]/meine-reisen/page.tsx` | Gäste: 1 Reise sichtbar; «Als Datei speichern»; Login für mehrere |
| `messages/*.json` | `myTripsPage.*`, plattformneutrale Datei-Hinweise (Windows & Mac) |

## LocalStorage / IndexedDB (neu)

- `sniffertrek_trip_file_links` – Metadaten pro `tripId` (`fileName`, `linkedAt`)
- `sniffertrek_file_banner_dismiss:{tripId}` – Banner «Später»
- IndexedDB `sniffertrek_trip_file_handles` – gespeicherte `FileSystemFileHandle`

## Dateiformat

```json
{
  "format": "sniffertrek-trip",
  "version": 1,
  "exportedAt": "ISO-8601",
  "trip": { … voller Trip inkl. Data-URL-Bilder … }
}
```

## Verhalten

1. **Speichern unter …** – Systemdialog → erste vollständige Datei → Handle in IndexedDB (wenn API verfügbar).
2. **Auto-Write** – ~1,6 s nach Trip-Änderung + nach normalem `saveTrip` (`flushWrite`).
3. **Reise öffnen …** – Datei laden → `saveTrip` + Planer-State.
4. **Datei verbinden** – nach Reload/Safari: gleiche Datei wählen, `trip.id` muss passen.
5. **Kopie laden** – einmaliger Download, **kein** Auto-Overwrite.
6. **Cloud** – unverändert; läuft parallel wenn eingeloggt.

## Zurückbauen (Revert)

```bash
cd sniffertrek-web
git checkout -- \
  src/lib/tripLocalFileDocument.ts \
  src/lib/tripLocalFileAccess.ts \
  src/components/TripLocalFileBar.tsx \
  src/app/[locale]/planer/page.tsx \
  messages/de.json messages/en.json messages/es.json
rm -f docs/LOCAL_FILE_SAVE_AENDERUNGEN.md
```

Optional im Browser DevTools:

- `localStorage.removeItem('sniffertrek_trip_file_links')`
- Keys `sniffertrek_file_banner_dismiss:*` löschen
- IndexedDB Datenbank `sniffertrek_trip_file_handles` löschen

## Bekannte Grenzen

- Sehr grosse Reisen (viele Fotos) → grosse JSON-Datei, Schreiben kann dauern.
- Zwei Tabs mit derselben Datei → letzter Schreibvorgang gewinnt.
- Ohne File System Access nur Download + manuelles erneutes Speichern / Öffnen.
