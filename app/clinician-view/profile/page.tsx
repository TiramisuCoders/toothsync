"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Mail, Phone, MapPin, BookOpen, Users } from "lucide-react"

export default function ClinicianProfile() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal and academic details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src="/placeholder-1nurk.png" alt="Profile" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">Jane Smith</h2>
            <p className="text-muted-foreground mb-4">Clinician ID: CLN-2023-001</p>

            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">5th Year - Section A</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">jane.smith@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">+63 912 345 6789</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Manila, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined: August 2023</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Group: Dental Surgery</span>
              </div>
            </div>

            <Button className="mt-6 w-full" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </Button>
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Personal Details</TabsTrigger>
              <TabsTrigger value="academic">Academic Info</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue="Jane" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue="Smith" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="jane.smith@example.com" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" defaultValue="+63 912 345 6789" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" defaultValue="Manila, Philippines" />
                      </div>

                      <Button type="submit">Save Changes</Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">First Name</Label>
                          <p>Jane</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Last Name</Label>
                          <p>Smith</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p>jane.smith@example.com</p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Phone Number</Label>
                        <p>+63 912 345 6789</p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Address</Label>
                        <p>Manila, Philippines</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                  <CardDescription>Your academic details and progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Student ID</Label>
                      <p>2023-12345</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Clinician ID</Label>
                      <p>CLN-2023-001</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Year Level</Label>
                      <p>5th Year</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Section</Label>
                      <p>Section A</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Specialization Group</Label>
                    <p>Dental Surgery</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Academic Advisor</Label>
                    <p>Dr. Robert Johnson</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Enrollment Date</Label>
                    <p>August 15, 2023</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Expected Graduation</Label>
                    <p>May 2025</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Change Password</Label>
                    <Input id="password" type="password" placeholder="Enter new password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                  </div>

                  <Button>Update Password</Button>

                  <div className="pt-4 border-t mt-6">
                    <h3 className="font-medium mb-2">Notification Preferences</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <Input id="emailNotifications" type="checkbox" className="w-4 h-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <Input id="smsNotifications" type="checkbox" className="w-4 h-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="appNotifications">In-App Notifications</Label>
                        <Input id="appNotifications" type="checkbox" className="w-4 h-4" defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
