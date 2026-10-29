# Supabase (SnifferTrek)

## Einmal ausführen: Rechte & Sicherheit (Data API / Mai–Oktober 2026)

Du musst **nur diesen einen Schritt** machen — alles Weitere steht schon in der SQL-Datei.

1. Öffne [Supabase Dashboard](https://supabase.com/dashboard) → dein Projekt **SnifferTrek**.
2. Links: **SQL Editor** → **New query**.
3. Öffne im Editor/IDE die Datei  
   `supabase/migrations/20260210120000_sniffertrek_public_rls_grants.sql`  
   und kopiere den **gesamten** Inhalt in das SQL-Fenster.
4. Klicke auf **Run** (oder Strg/Cmd + Enter).
5. Es sollte **Success** ohne rote Fehler erscheinen.
6. Optional: **Database** → **Security Advisor** nochmal öffnen — sollte weniger/weniger kritische Hinweise zeigen.

### Was die Datei macht

- **`trips`**: Row Level Security (nur eigene Zeilen per `user_id`), plus explizite `GRANT`s für `authenticated` und `service_role`.
- **`affiliate_clicks`**: Legt die Tabelle an, **falls** sie noch fehlt (Struktur wie die App), dann RLS (nur **Insert** für Gäste und Nutzer — keine öffentlichen Reads) und `GRANT`s.

### Wenn ein Fehler kommt

- Meldung wie „relation trips does not exist“: Die Tabelle `trips` fehlt — dann zuerst in Supabase die Tabelle wie bisher anlegen (oder Support), danach diese Migration erneut ausführen.
- Meldung zu Spalten-Typen (`user_id`): In der SQL-Datei steht ein kurzer Hinweis bei den Policies; bei Bedarf eine Zeile anpassen (Kommentar in der Datei).

### Später neue Tabellen

Für jede **neue** Tabelle in `public`, die die App per `supabase.from(...)` nutzt: immer **GRANT + RLS + Policies** in dieselbe Migrations-Datei (oder eine neue Datei unter `supabase/migrations/`) legen und wieder im SQL Editor ausführen.

## Reise-Freigabe (teilen / mitbearbeiten)

1. SQL Editor → Inhalt von  
   `supabase/migrations/20260820120000_trip_sharing.sql`  
   ausführen.
2. Im Planer beim Reisennamen auf das **Teilen**-Icon klicken → Link mit Lesen oder Schreiben erzeugen.
3. Die andere Person öffnet `/teilen/<token>`, meldet sich an und nimmt die Einladung an.
4. Beide sehen dieselbe Cloud-Reise; paralleles Speichern: zuletzt gespeicherte Version gewinnt.

## Einladung per E-Mail

1. SQL Editor → `supabase/migrations/20260821133000_trip_invite_by_email.sql` ausführen.
2. Im Freigabe-Dialog E-Mail + Rechte (Schreiben/Lesen) eintragen → **Per E-Mail freigeben**.
3. Die Person meldet sich mit **genau dieser E-Mail** an – dann erscheint die Reise unter Meine Reisen.


1. SQL Editor → Inhalt von  
   `supabase/migrations/20260820153000_trip_collaboration_activity.sql`  
   ausführen (nach der Freigabe-Migration).
2. Falls Fehler `infinite recursion detected in policy for relation "trips"`:  
   zusätzlich `supabase/migrations/20260821130000_fix_trips_rls_recursion.sql` ausführen.
3. Im Planer erscheint oben ein Balken, wenn jemand anderes die Reise gerade geöffnet hat.
4. Button **Änderungen** zeigt das Protokoll (wer / was / wann) nach Cloud-Speichern.
