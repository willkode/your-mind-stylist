import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Calendar, Video, Mail, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function TransitionGuide() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Transition from Acuity to Your New System</h1>
          <p className="text-[#2B2725]/70 mb-8">
            A step-by-step guide to smoothly migrate your booking system while keeping your existing clients happy
          </p>

          {/* Timeline */}
          <Alert className="mb-8 bg-gradient-to-r from-[#D8B46B]/10 to-[#D8B46B]/5 border-[#D8B46B]">
            <Clock className="text-[#D8B46B]" />
            <AlertDescription>
              <strong>Recommended Timeline:</strong> 30-60 day transition period where both systems run in parallel
            </AlertDescription>
          </Alert>

          {/* Phase 1: Setup */}
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-[#1E3A32] to-[#2B4A40] text-white">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">1</div>
                Phase 1: Initial Setup (Week 1)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                  Step 1: Connect Your Mac Calendar to Google
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80 space-y-2">
                  <p><strong>On iPhone:</strong></p>
                  <ol className="list-decimal list-inside pl-4 space-y-1">
                    <li>Settings → Calendar → Accounts → Add Account</li>
                    <li>Select "Google" and sign in with your NEW Google account</li>
                    <li>Make sure "Calendars" toggle is ON</li>
                    <li>Your Mac Calendar events will now sync to Google</li>
                  </ol>
                  <p className="mt-3"><strong>On Mac:</strong></p>
                  <ol className="list-decimal list-inside pl-4 space-y-1">
                    <li>System Settings → Internet Accounts</li>
                    <li>Click the + button and select Google</li>
                    <li>Sign in with your NEW Google account</li>
                    <li>Enable "Calendars" checkbox</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                  Step 2: Connect Integrations to Your Booking System
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80">
                  <Link to={createPageUrl("IntegrationSetup")} className="text-[#1E3A32] hover:text-[#D8B46B] font-medium flex items-center gap-2">
                    Go to Integration Setup <ArrowRight size={16} />
                  </Link>
                  <ol className="list-decimal list-inside pl-4 space-y-1 mt-2">
                    <li>Connect Google Calendar (the one you just synced your Mac Calendar to)</li>
                    <li>Connect Zoom (same account you used with Acuity)</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                  Step 3: Set Your Availability
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80">
                  <Link to={createPageUrl("ManagerAvailability")} className="text-[#1E3A32] hover:text-[#D8B46B] font-medium flex items-center gap-2">
                    Configure Your Availability <ArrowRight size={16} />
                  </Link>
                  <p className="mt-2">Set the same hours you had in Acuity to start</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                  Step 4: Block Existing Acuity Bookings
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80">
                  <p>Since your Acuity bookings are in your Mac Calendar, and Mac Calendar is now synced to Google:</p>
                  <ol className="list-decimal list-inside pl-4 space-y-1 mt-2">
                    <li>Go to <Link to={createPageUrl("CalendarSettings")} className="text-[#1E3A32] hover:text-[#D8B46B] font-medium underline">Calendar Settings</Link></li>
                    <li>Click "Sync Now" to import all existing appointments</li>
                    <li>These times will be automatically blocked from new bookings</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 2: Parallel Run */}
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-[#6E4F7D] to-[#8B659B] text-white">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">2</div>
                Phase 2: Parallel Run (Weeks 2-6)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="text-yellow-600" />
                <AlertDescription className="text-yellow-900 text-sm">
                  <strong>Important:</strong> Keep Acuity active during this period to honor existing bookings
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <Mail size={20} className="text-[#D8B46B]" />
                  Communicate with Existing Clients
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80">
                  <p className="mb-2">Send an email to your client list:</p>
                  <div className="bg-white border border-[#E4D9C4] p-4 rounded-lg font-mono text-xs">
                    <p className="mb-2"><strong>Subject:</strong> New & Improved Booking System 🎉</p>
                    <p className="mb-3"><strong>Body:</strong></p>
                    <div className="text-[#2B2725]/70 space-y-2">
                      <p>Hi [Name],</p>
                      <p>I'm excited to share that I've upgraded my booking system to serve you better!</p>
                      <p><strong>What this means for you:</strong></p>
                      <ul className="list-disc list-inside pl-4">
                        <li>Easier scheduling with a modern interface</li>
                        <li>Automatic Zoom links sent instantly</li>
                        <li>Better calendar integration</li>
                      </ul>
                      <p className="mt-3"><strong>For new appointments, please use:</strong><br />
                      <span className="text-[#1E3A32] font-bold">yourmindstylist.com/bookings</span></p>
                      <p className="mt-3"><strong>Your existing appointments are safe</strong> - no action needed for those.</p>
                      <p className="mt-3">Questions? Just reply to this email.</p>
                      <p className="mt-3">Looking forward to our next session!<br />Roberta</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                  Update Your Website & Social Media
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80 space-y-2">
                  <p>Replace old Acuity links with: <code className="bg-[#1E3A32]/10 px-2 py-1 rounded">yourmindstylist.com/bookings</code></p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Update email signature</li>
                    <li>Update social media bios</li>
                    <li>Update any marketing materials</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <Calendar size={20} className="text-[#D8B46B]" />
                  Weekly Calendar Sync
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80">
                  <p>Every week, go to <Link to={createPageUrl("CalendarSettings")} className="text-[#1E3A32] hover:text-[#D8B46B] font-medium underline">Calendar Settings</Link> and click "Sync Now" to import any new Acuity bookings from your Mac Calendar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 3: Full Migration */}
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-[#D8B46B] to-[#E4C784] text-[#1E3A32]">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center font-bold">3</div>
                Phase 3: Complete Migration (Week 7+)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                  Close Acuity Account
                </h3>
                <div className="pl-7 text-sm text-[#2B2725]/80 space-y-2">
                  <p>Once all existing Acuity bookings are complete:</p>
                  <ol className="list-decimal list-inside pl-4 space-y-1">
                    <li>Download a backup of all Acuity data</li>
                    <li>Set up email forwarding from old booking emails to your new system</li>
                    <li>Cancel Acuity subscription</li>
                  </ol>
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="text-green-600" />
                <AlertDescription className="text-green-900 text-sm">
                  <strong>Congratulations!</strong> You're now fully transitioned to your new booking system
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card className="bg-gradient-to-br from-[#1E3A32]/5 to-white border-[#1E3A32]/20">
            <CardHeader>
              <CardTitle>Quick Reference Links</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Link to={createPageUrl("IntegrationSetup")} className="flex items-center justify-between p-3 bg-white border border-[#E4D9C4] rounded hover:border-[#D8B46B] transition-colors">
                <span className="text-sm font-medium">Connect Integrations</span>
                <ArrowRight size={16} className="text-[#D8B46B]" />
              </Link>
              <Link to={createPageUrl("CalendarSettings")} className="flex items-center justify-between p-3 bg-white border border-[#E4D9C4] rounded hover:border-[#D8B46B] transition-colors">
                <span className="text-sm font-medium">Calendar Settings</span>
                <ArrowRight size={16} className="text-[#D8B46B]" />
              </Link>
              <Link to={createPageUrl("ManagerAvailability")} className="flex items-center justify-between p-3 bg-white border border-[#E4D9C4] rounded hover:border-[#D8B46B] transition-colors">
                <span className="text-sm font-medium">Set Availability</span>
                <ArrowRight size={16} className="text-[#D8B46B]" />
              </Link>
              <Link to={createPageUrl("ManagerAppointmentTypes")} className="flex items-center justify-between p-3 bg-white border border-[#E4D9C4] rounded hover:border-[#D8B46B] transition-colors">
                <span className="text-sm font-medium">Appointment Types</span>
                <ArrowRight size={16} className="text-[#D8B46B]" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}