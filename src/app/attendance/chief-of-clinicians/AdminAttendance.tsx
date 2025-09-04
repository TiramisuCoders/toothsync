"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Clock } from "lucide-react";

// Updated interface to match the data structure from route.ts
export interface Record {
  id: string;
  firstName: string;
  lastName: string;
  timeIn: string;
  timeOut: string;
  date: string;
  status: string;
  sanitize?: string; // added
}

export default function AdminAttendance() {
  const [activeFilter, setActiveFilter] = useState<"all" | "today">("all");
  const [attendanceRecords, setAttendanceRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch attendance data when component mounts
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using the clerk endpoint that matches your route.ts
        const response = await fetch('/api/attendance/clerk', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - Please check your login status');
          } else if (response.status === 403) {
            throw new Error('Forbidden - You do not have permission to view this data');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const result = await response.json();
        
        if (result.success) {
          setAttendanceRecords(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch attendance data');
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Filter records based on active filter
  const filteredRecords = activeFilter === "today" 
    ? attendanceRecords.filter(record => {
        const recordDate = new Date(record.date).toDateString();
        const today = new Date().toDateString();
        return recordDate === today;
      })
    : attendanceRecords;

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{status}</Badge>;
      case "Pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="text-center py-12 text-gray-500">
            Loading attendance records...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="text-center py-12 text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <CardTitle className="text-xl font-semibold text-[#333]">Attendance Records</CardTitle>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeFilter === "all" ? "default" : "ghost"}
              size="sm"
              className={activeFilter === "all" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
              onClick={() => setActiveFilter("all")}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "today" ? "default" : "ghost"}
              size="sm"
              className={activeFilter === "today" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
              onClick={() => setActiveFilter("today")}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-white border-b border-gray-200">
            <TableRow className="hover:bg-white border-b-0">
              <TableHead className="font-medium text-[#333]">Attendance ID</TableHead>
              <TableHead className="font-medium text-[#333]">First Name</TableHead>
              <TableHead className="font-medium text-[#333]">Last Name</TableHead>
              <TableHead className="font-medium text-[#333]">Time In</TableHead>
              <TableHead className="font-medium text-[#333]">Time Out</TableHead>
              <TableHead className="font-medium text-[#333]">Date</TableHead>
              <TableHead className="font-medium text-[#333]">Sanitize</TableHead>
              <TableHead className="font-medium text-[#333]">Status</TableHead>
              <TableHead className="font-medium text-[#333]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50 border-b border-gray-200">
                  <TableCell className="font-medium text-[#333]">{record.id}</TableCell>
                  <TableCell className="text-[#333]">{record.firstName}</TableCell>
                  <TableCell className="text-[#333]">{record.lastName}</TableCell>
                  <TableCell className="text-[#333]">{record.timeIn || "-"}</TableCell>
                  <TableCell className="text-[#333]">
                    {record.timeOut ? (
                      record.timeOut
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-300">
                        Not recorded
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[#333]">{record.date}</TableCell>

                  {/* Sanitize dropdown */}
                  <TableCell className="text-[#333]">
                    <Select
                      value={(record.sanitize ?? "No").toLowerCase()}
                      onValueChange={(value) => {
                        setAttendanceRecords((prev) =>
                          prev.map((r) =>
                            r.id === record.id ? { ...r, sanitize: value === "yes" ? "Yes" : "No" } : r
                          )
                        );
                      }}
                    >
                      <SelectTrigger
                        className={`w-20 h-7 ${
                          (record.sanitize ?? "No") === "Yes" ? "text-[#5C8E77]" : "text-red-500"
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>{getStatusBadge(record.status)}</TableCell>

                  {/* Action icons */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {record.status === "Pending" ? (
                        <>
                          {/* Gray check (disabled when pending—enable later if you add logic) */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400"
                            disabled
                            aria-label="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </Button>

                          {/* Red X */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            aria-label="Archive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Clock: blue if no timeout yet, gray if already timed out */}
                          {!record.timeOut ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    aria-label="Time out"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Record time out</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-400"
                              disabled
                              aria-label="Time out"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Red X */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            aria-label="Archive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
