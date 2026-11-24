
import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
    "https://bmjltkszsnnthssahlbn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_p_wne9kR5jVFU4L0sN-WPQ_kBsLGiuq";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Dairy Connect Supabase client initialized!");
