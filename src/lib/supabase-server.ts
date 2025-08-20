// import { cookies } from 'next/headers'
// import { createServerClient } from '@supabase/ssr'

// export const createSupabaseServerClient = async () => {
//   const cookieStore = await cookies(); // 🔴 await is required here

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name) {
//           return cookieStore.get(name)?.value;
//         },
//         set() {
//           // No need for SSR-only usage
//         },
//         remove() {}
//       }
//     }
//   );
// };

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie setting errors in route handlers
            console.warn('Could not set cookies in route handler')
          }
        },
      },
    }
  )
}