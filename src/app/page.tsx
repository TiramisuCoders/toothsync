// src/app/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function Home() {
  const cookieStore = await cookies() // ✅ Await this
  const role = cookieStore.get("role")?.value

  const rolePaths: Record<string, string> = {
    "clinician": "/dashboard/clinician",
    "clerk": "/dashboard/clerk",
    "chief-of-clinicians": "/dashboard/chief-of-clinicians",
    "clinical-instructor": "/dashboard/clinical-instructor",
  }

  redirect(rolePaths[role as string] ?? "/landing")
}
