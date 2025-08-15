import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies(); // 🔴 await is required here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // No need for SSR-only usage
        },
        remove() {}
      }
    }
  );
};
