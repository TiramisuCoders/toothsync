// app/support/faq/new-ticket/page.tsx
"use client"

import SubmitTicketForm from "./SubmitTicketForm"

export default function NewTicketPage() {
  // This renders the SubmitTicketForm component within the existing SupportLayout
  return (
    <div className="py-8 px-4 md:px-8 bg-gray-100"> 
      <SubmitTicketForm />
    </div>
  )
}