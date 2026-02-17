-- SnifferTrek Datenbank-Schema für Supabase
-- Dieses SQL in der Supabase SQL-Konsole ausführen

-- Trips Tabelle
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Neue Reise',
  travel_mode TEXT NOT NULL DEFAULT 'auto',
  stops JSONB NOT NULL DEFAULT '[]',
  start_date TEXT,
  end_date TEXT,
  travelers INTEGER NOT NULL DEFAULT 2,
  hotels JSONB NOT NULL DEFAULT '[]',
  bucket_list JSONB NOT NULL DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security aktivieren
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer sehen nur eigene Trips
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Benutzer können eigene Trips erstellen
CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können eigene Trips aktualisieren
CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Benutzer können eigene Trips löschen
CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON trips(updated_at DESC);
