import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://emlqrrwmahbpabqfourn.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GzhiFmwnQjYuoHn5SNdt-A_yc8Epwa1'

export const supabase = createClient(supabaseUrl, supabaseKey)