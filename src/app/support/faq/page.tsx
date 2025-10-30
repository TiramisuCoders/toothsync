"use client"

import { Phone, Mail, Clock } from "lucide-react"

export default function FAQPage() {
  const faqs = [
    {
      id: 1,
      category: "chair-requests",
      question: "How do I request a chair assignment for my patient?",
      answer:
        'To request a chair assignment, log into the system and navigate to the "Chair Requests" section. Fill out the patient information, select your preferred time slot, and submit the request. The system will automatically match you with available chairs and clinical instructors.',
    },
    {
      id: 2,
      category: "instructors",
      question: "How are clinical instructors assigned to my sessions?",
      answer:
        "Clinical instructors are automatically assigned based on availability, expertise, and workload distribution. The system uses an intelligent matching algorithm to ensure optimal supervision. You can view your assigned instructor details in your dashboard.",
    },
    {
      id: 3,
      category: "account",
      question: "What are the different user roles in the system?",
      answer:
        "The system has four main user roles: Students (request chairs and view schedules), Clinical Instructors (supervise sessions and provide feedback), Administrators (manage system settings and users), and Super Admins (full system access and configuration).",
    },
    {
      id: 4,
      category: "technical",
      question: "I'm having trouble logging into the system. What should I do?",
      answer:
        "First, ensure you're using the correct credentials provided by your institution. If you've forgotten your password, use the \"Forgot Password\" link on the login page. For persistent issues, contact the IT support team or submit a support ticket through this page.",
    },
    {
      id: 5,
      category: "scheduling",
      question: "Can I modify or cancel my chair reservation?",
      answer:
        'Yes, you can modify or cancel your chair reservation up to 2 hours before the scheduled time. Go to "My Reservations" in your dashboard, select the booking you want to change, and choose either "Modify" or "Cancel". Late cancellations may affect your booking priority.',
    },
    {
      id: 6,
      category: "technical",
      question: "How do I update my profile information?",
      answer:
        'Click on your profile picture in the top-right corner and select "Profile Settings". You can update your contact information, emergency contacts, and notification preferences. Some information may require administrator approval to change.',
    },
    {
      id: 7,
      category: "general",
      question: "How does the automated matching system work?",
      answer:
        "The system uses advanced algorithms to match students with available chairs and instructors based on multiple factors: time preferences, instructor expertise, student level, equipment requirements, and historical performance data. This ensures optimal learning experiences and resource utilization.",
    },
  ]

  return (
    <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600">Find answers to common questions about the Dental Laboratory Support System</p>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <details className="group">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 pr-4">{faq.question}</h3>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-[#5C8E77] bg-opacity-10 flex items-center justify-center group-open:rotate-45 transition-transform">
                    <div className="w-3 h-3 text-[#5C8E77]">
                      <svg viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6.5 0h-1v5.5H0v1h5.5V12h1V6.5H12v-1H6.5V0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need More Help?</h3>
        <div className="space-y-4 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-3 text-[#5C8E77]" />
            <span>+63 (02) 8123-4567</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-3 text-[#5C8E77]" />
            <span>support@deocampo.edu.ph</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-3 text-[#5C8E77]" />
            <span>Mon-Fri, 8AM-5PM</span>
          </div>
        </div>
        <div className="flex gap-4">
          <a
            href="/incident/new-ticket"
            className="flex-1 bg-[#5C8E77] text-white px-4 py-2 rounded-lg hover:bg-[#406E58] transition-colors text-center"
          >
            Submit Support Ticket
          </a>
          <a
            href="/incident/my-tickets"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            View My Tickets
          </a>
        </div>
      </div>
    </div>
  )
}