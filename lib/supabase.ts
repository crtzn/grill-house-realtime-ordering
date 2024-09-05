import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);
// service_role_key is for admin side lang siya...
// anon key for the users.
// so if wala ka naman dashboard, mas mabuti is alisin mo na lang yung
// supabase admin mo... Use anon key na lang para safe ang life:>
