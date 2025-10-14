// src/app/api/form/clinician/route.ts
import { getUserData } from "./actions"

export async function GET(request: Request) {
  const data = await getUserData()
  return Response.json(data)
}