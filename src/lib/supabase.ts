import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const supabase: SupabaseClient = createClient(
  "https://nsbextebigfuhqujysev.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmV4dGViaWdmdWhxdWp5c2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDYzNjYsImV4cCI6MjA4NjkyMjM2Nn0.MSFCN4PhU5px0gjDitq4CjVxrxUXy2OVa6UuoQrBtp0"
);

export function isSupabaseConfigured(): boolean {
  return true;
}
