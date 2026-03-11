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

-- Affiliate Click Tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module TEXT NOT NULL,
  provider TEXT NOT NULL,
  target_url TEXT NOT NULL,
  trip_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  destination TEXT,
  origin TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anonymous and logged-in users.
CREATE POLICY "Anyone can insert affiliate clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read their own click records.
CREATE POLICY "Users can read own affiliate clicks"
  ON affiliate_clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_provider ON affiliate_clicks(provider);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON affiliate_clicks(user_id);

-- Storage bucket for prepared PDF overview maps
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-maps', 'trip-maps', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read/write only files under their own folder: <user_id>/<trip_id>/...
CREATE POLICY "Users can read own trip maps"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'trip-maps'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can insert own trip maps"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-maps'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own trip maps"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'trip-maps'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own trip maps"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trip-maps'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
