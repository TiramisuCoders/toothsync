"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import Image from "next/image"
import { Search, Plus, Filter, ArrowUpDown, Clock, CheckCircle, Calendar, History, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" 
import { useRouter } from "next/navigation"

// Define the Ticket interface
interface Ticket {
  id: string
  title: string
  module: string
  status: "Pending" | "In Progress" | "Resolved"
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  date: string // e.g., "5/10/2025"
  time: string // e.g., "09:37 AM"
}

export default function MyTicketsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"All Tickets" | "Pending" | "In Progress" | "Resolved">("All Tickets")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ticketsPerPage = 5 // Number of tickets to show per page

  // 🔴 REMOVE THIS SAMPLE DATA WHEN CONNECTING TO DATABASE
  // 🟢 REPLACE WITH DATA FETCHED FROM YOUR DATABASE
  const allTickets: Ticket[] = useMemo(
    () => [
      {
        id: "TS-2025-00123",
        title: "Wala po akong Instructor",
        module: "Instructor Management",
        status: "Pending",
        priority: "Medium Priority",
        date: "5/10/2025",
        time: "09:37 AM",
      },
      {
        id: "TS-2025-00124",
        title: "Mali po 'yung nakadisplay na name ko",
        module: "Dashboard/UI",
        status: "In Progress",
        priority: "Medium Priority",
        date: "5/06/2025",
        time: "04:50 PM",
      },
      {
        id: "TS-2025-00125",
        title: "Wrong Credentials entered",
        module: "Login & Authentication",
        status: "In Progress",
        priority: "High Priority",
        date: "5/06/2025",
        time: "08:01 PM",
      },
      {
        id: "TS-2025-00126",
        title: "Can't submit request form",
        module: "Service Request Form",
        status: "Resolved",
        priority: "Medium Priority",
        date: "5/01/2025",
        time: "2:00 PM",
      },
      {
        id: "TS-2025-00127",
        title: "Database connection issue",
        module: "Others",
        status: "Pending",
        priority: "High Priority",
        date: "5/12/2025",
        time: "11:00 AM",
      },
      {
        id: "TS-2025-00128",
        title: "Missing report data",
        module: "Dashboard/UI",
        status: "In Progress",
        priority: "Medium Priority",
        date: "5/11/2025",
        time: "03:15 PM",
      },
      {
        id: "TS-2025-00129",
        title: "User profile not updating",
        module: "Login & Authentication",
        status: "Resolved",
        priority: "Low Priority",
        date: "5/09/2025",
        time: "10:00 AM",
      },
    ],
    [],
  )

  // Filter tickets based on active tab and search term
  const filteredTickets = useMemo(() => {
    let filtered = allTickets

    if (activeTab !== "All Tickets") {
      filtered = filtered.filter((ticket) => ticket.status === activeTab)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.module.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    return filtered
  }, [allTickets, activeTab, searchTerm])

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage)
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ticketsPerPage
    const endIndex = startIndex + ticketsPerPage
    return filteredTickets.slice(startIndex, endIndex)
  }, [filteredTickets, currentPage, ticketsPerPage])

  const handleNewTicket = () => {
    router.push("/support/new-ticket")
  }

  const getStatusIcon = (status: Ticket["status"]) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "In Progress":
        return <History className="w-4 h-4 text-blue-600" />
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      default:
        return null
    }
  }

  const getStatusBadgeColors = (status: Ticket["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Resolved":
        return "bg-emerald-100 text-emerald-800"
      default:
        return ""
    }
  }

  const getPriorityBadgeColors = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "Low Priority":
        return "bg-gray-100 text-gray-800"
      case "Medium Priority":
        return "bg-yellow-100 text-yellow-800"
      case "High Priority":
        return "bg-red-100 text-red-800"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-poppins flex flex-col">
      {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-700 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
        <Link href="/landing" passHref>
          <Image
            src="/images/DOMC-logo.png" 
            alt="App Logo"
            width={75}
            height={7}
            className="object-contain"
          />
        </Link>
          <div>
            <h1 className="text-xl font-bold">Ticket Tracker</h1>
            <p className="text-sm text-emerald-100">Dental Clinic Laboratory Support System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search tickets by ID or title..."
              className="pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
            />
          </div>
          <Button
            onClick={handleNewTicket}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
        <main className="flex-1 p-6 pt-20">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {["All Tickets", "Pending", "In Progress", "Resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as typeof activeTab)
                  setCurrentPage(1) // Reset to first page on tab change
                }}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-emerald-600 text-emerald-700"
                    : "text-gray-600 hover:text-gray-800"
                } transition-colors duration-200`}
              >
                {tab}
              </button>
            ))}
            <div className="flex-grow" /> {/* Spacer to push filter/sort to right */}
            <div className="flex gap-2">
              <Button variant="outline" className="text-gray-600 hover:bg-gray-50 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="text-gray-600 hover:bg-gray-50 bg-transparent">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>

          {/* Ticket List */}
          <div className="space-y-4">
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mr-4">{getStatusIcon(ticket.status)}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">{ticket.module}</p>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{ticket.date}</span>
                      <Clock className="w-3 h-3 ml-3 mr-1" />
                      <span>{ticket.time}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex gap-2">
                      <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1 text-xs font-medium`}>
                        {ticket.status}
                      </Badge>
                      <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1 text-xs font-medium`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50">
                        View Details
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-50">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No tickets found for this selection.</div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <span>
              Showing {paginatedTickets.length} out of {filteredTickets.length} tickets
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
