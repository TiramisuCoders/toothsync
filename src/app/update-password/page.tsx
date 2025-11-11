// app/update-password/page.tsx

import { Suspense } from 'react'
import UpdatePasswordClient from './UpdatePasswordClient'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-700 font-medium">Loading password reset page...</p>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UpdatePasswordClient />
    </Suspense>
  )
}