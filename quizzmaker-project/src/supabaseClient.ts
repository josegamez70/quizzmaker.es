

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types.ts';

// Configuración final del cliente de Supabase con las claves del proyecto.
const supabaseUrl = "https://hpavqewlxgyfkmyqzwzs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYXZxZXdseGd5ZmtteXF6d3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjMzMTQsImV4cCI6MjA2NzE5OTMxNH0.wS5Q_5BUP4fuLRjEhZcqxYoNPOWJ1SyRayqL5-reoBY";

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Las variables de Supabase no están configuradas.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);