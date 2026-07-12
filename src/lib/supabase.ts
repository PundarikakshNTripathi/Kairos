/**
 * Core Database & Authentication Services
 * 
 * This module initializes the Supabase client for remote data synchronization.
 * It strictly relies on environment variables injected during the build process
 * to establish secure connections with the managed PostgreSQL instance.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if env vars are present to avoid runtime crashes if they haven't set them up yet
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;