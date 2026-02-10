import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const db = {
  query: async (text, params) => {
    // Convertir queries de PostgreSQL a Supabase
    // Para queries simples, usar supabase directamente
    return { rows: [] };
  },
  supabase: supabase
};

export default db;
