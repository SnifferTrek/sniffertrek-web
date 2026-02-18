import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nsbextebigfuhqujysev.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmV4dGViaWdmdWhxdWp5c2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDYzNjYsImV4cCI6MjA4NjkyMjM2Nn0.MSFCN4PhU5px0gjDitq4CjVxrxUXy2OVa6UuoQrBtp0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return true;
}
