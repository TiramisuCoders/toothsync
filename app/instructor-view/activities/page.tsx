export default function InstructorActivitiesPage() {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#333]">All Activities</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-[#5C8E77] text-white hover:bg-[#4a7260]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Activity
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-1">
                    Act ID
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m7 15 5 5 5-5" />
                      <path d="m7 9 5-5 5 5" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">First Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-1">
                    Last Name
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m7 15 5 5 5-5" />
                      <path d="m7 9 5-5 5 5" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Chair</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Instructor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Procedure</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">1</td>
                <td className="px-4 py-3 text-sm text-gray-900">Maria</td>
                <td className="px-4 py-3 text-sm text-gray-900">Santos</td>
                <td className="px-4 py-3 text-sm text-gray-900">Juan Dela Cruz</td>
                <td className="px-4 py-3 text-sm text-gray-900">Chair 05</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dr. Reyes</td>
                <td className="px-4 py-3 text-sm text-gray-900">Root Canal Treatment</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Started
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">2</td>
                <td className="px-4 py-3 text-sm text-gray-900">John</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dela Cruz</td>
                <td className="px-4 py-3 text-sm text-gray-900">Ana Reyes</td>
                <td className="px-4 py-3 text-sm text-gray-900">Chair 12</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dr. Mendoza</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dental Filling</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Not started
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">3</td>
                <td className="px-4 py-3 text-sm text-gray-900">Anna</td>
                <td className="px-4 py-3 text-sm text-gray-900">Lim</td>
                <td className="px-4 py-3 text-sm text-gray-900">Miguel Santos</td>
                <td className="px-4 py-3 text-sm text-gray-900">Chair 03</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dr. Santos</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dental Crown</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Started
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">4</td>
                <td className="px-4 py-3 text-sm text-gray-900">Mark</td>
                <td className="px-4 py-3 text-sm text-gray-900">Aquino</td>
                <td className="px-4 py-3 text-sm text-gray-900">Sofia Reyes</td>
                <td className="px-4 py-3 text-sm text-gray-900">Chair 08</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dr. Reyes</td>
                <td className="px-4 py-3 text-sm text-gray-900">Teeth Cleaning</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Completed
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 5 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">5</td>
                <td className="px-4 py-3 text-sm text-gray-900">Sarah</td>
                <td className="px-4 py-3 text-sm text-gray-900">Garcia</td>
                <td className="px-4 py-3 text-sm text-gray-900">Luis Tan</td>
                <td className="px-4 py-3 text-sm text-gray-900">Chair 10</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dr. Tan</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dental Extraction</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Incomplete</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 6 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">6</td>
                <td className="px-4 py-3 text-sm text-gray-900">Carlos</td>
                <td className="px-4 py-3 text-sm text-gray-900">Mendoza</td>
                <td className="px-4 py-3 text-sm text-gray-900">Elena Cruz</td>
                <td className="px-4 py-3 text-sm text-gray-900">Chair 07</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dr. Santos</td>
                <td className="px-4 py-3 text-sm text-gray-900">Dental Filling</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Completed
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="text-gray-500 hover:text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
