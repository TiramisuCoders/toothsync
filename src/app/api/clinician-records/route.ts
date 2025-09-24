import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Starting GET /api/clinician-records")

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get("academicYear")
    const yearLevel = searchParams.get("yearLevel")
    const section = searchParams.get("section")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    console.log("[v0] Clinician Records API - Params:", { academicYear, yearLevel, section, search, page, limit })

    const mockClinicianRecords = [
      {
        id: "CR001",
        clinicianId: "2021-00001",
        firstName: "Maria",
        lastName: "Santos",
        year: "4th Year",
        section: "A",
        sex: "Female",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T08:00:00Z",
      },
      {
        id: "CR002",
        clinicianId: "2021-00002",
        firstName: "Juan",
        lastName: "Dela Cruz",
        year: "4th Year",
        section: "A",
        sex: "Male",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T08:15:00Z",
      },
      {
        id: "CR003",
        clinicianId: "2021-00003",
        firstName: "Ana",
        lastName: "Rodriguez",
        year: "3rd Year",
        section: "B",
        sex: "Female",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T08:30:00Z",
      },
      {
        id: "CR004",
        clinicianId: "2021-00004",
        firstName: "Carlos",
        lastName: "Garcia",
        year: "4th Year",
        section: "B",
        sex: "Male",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T08:45:00Z",
      },
      {
        id: "CR005",
        clinicianId: "2021-00005",
        firstName: "Isabella",
        lastName: "Martinez",
        year: "3rd Year",
        section: "A",
        sex: "Female",
        academicYearId: "AY2022-001",
        createdAt: "2022-08-15T09:00:00Z",
      },
      {
        id: "CR006",
        clinicianId: "2021-00006",
        firstName: "Miguel",
        lastName: "Lopez",
        year: "4th Year",
        section: "C",
        sex: "Male",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T09:15:00Z",
      },
      {
        id: "CR007",
        clinicianId: "2021-00007",
        firstName: "Sofia",
        lastName: "Hernandez",
        year: "3rd Year",
        section: "B",
        sex: "Female",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T09:30:00Z",
      },
      {
        id: "CR008",
        clinicianId: "2021-00008",
        firstName: "Diego",
        lastName: "Morales",
        year: "4th Year",
        section: "A",
        sex: "Male",
        academicYearId: "AY2022-001",
        createdAt: "2022-08-15T09:45:00Z",
      },
      {
        id: "CR009",
        clinicianId: "2021-00009",
        firstName: "Camila",
        lastName: "Torres",
        year: "3rd Year",
        section: "C",
        sex: "Female",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T10:00:00Z",
      },
      {
        id: "CR010",
        clinicianId: "2021-00010",
        firstName: "Ricardo",
        lastName: "Vargas",
        year: "4th Year",
        section: "B",
        sex: "Male",
        academicYearId: "AY2023-001",
        createdAt: "2023-08-15T10:15:00Z",
      },
    ]

    let filteredData = mockClinicianRecords

    // Filter by academic year
    if (academicYear && academicYear !== "all") {
      filteredData = filteredData.filter((record) => record.academicYearId === academicYear)
    }

    // Filter by year level
    if (yearLevel && yearLevel !== "all") {
      filteredData = filteredData.filter((record) => record.year === yearLevel)
    }

    // Filter by section
    if (section && section !== "all") {
      filteredData = filteredData.filter((record) => record.section === section)
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase()
      filteredData = filteredData.filter(
        (record) =>
          record.clinicianId.toLowerCase().includes(searchTerm) ||
          record.firstName.toLowerCase().includes(searchTerm) ||
          record.lastName.toLowerCase().includes(searchTerm),
      )
    }

    const total = filteredData.length
    const totalPages = Math.ceil(total / limit)

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit)

    console.log("[v0] Clinician Records API - Found records:", paginatedData.length, "Total:", total)

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error("[v0] Clinician Records API Exception:", error)
    return NextResponse.json({ error: "Failed to fetch clinician records" }, { status: 500 })
  }
}
