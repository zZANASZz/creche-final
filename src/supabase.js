import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://emlqrrwmahbpabqfourn.supabase.co'
const supabaseKey = 'sb_publishable_GzhiFmwnQjYuoHn5SNdt-A_yc8Epwa1'

export const supabase = createClient(supabaseUrl, supabaseKey)