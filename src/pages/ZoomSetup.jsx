import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ZoomSetup() {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const redirectUri = `${window.location.origin}/zoom-callback`;

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D8B46B]/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-[#D8B46B]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 4.3 0 9.6c0 2.7 1.2 5.1 3.1 6.9V24l5.8-3.3c1.4.3 2.9.5 4.4.5 6.6 0 12-4.3 12-9.6S18.6 0 12 0z"/>
              </svg>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              Set Up Zoom Meetings
            </h1>
            <p className="text-[#2B2725]/70 text-lg max-w-2xl mx-auto">
              Connect your Zoom account to automatically create and manage video meetings for client sessions
            </p>
          </div>

          {/* Quick Overview */}
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">What You Need</h3>
                  <p className="text-sm text-blue-800">
                    A Zoom account (you can create a free account at zoom.us if you don't have one). You'll need API credentials, which takes about 5 minutes to set up.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Instructions */}
          <div className="space-y-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-white flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <CardTitle className="font-serif text-2xl text-[#1E3A32]">
                    Create a Zoom App
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#2B2725]/80">
                  First, you'll create an OAuth app in the Zoom Marketplace. This app will connect your booking system to Zoom.
                </p>
                
                <ol className="space-y-3 ml-6 list-decimal text-[#2B2725]/80">
                  <li>
                    Go to <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="text-[#D8B46B] hover:underline font-medium flex items-center gap-1 inline-flex">
                      Zoom Marketplace <ExternalLink size={14} />
                    </a> and sign in with your Zoom account
                  </li>
                  <li>Click <strong>"Develop"</strong> → <strong>"Build App"</strong></li>
                  <li>Choose <strong>"OAuth"</strong> as the app type</li>
                  <li>Fill in the app details:
                    <ul className="ml-4 mt-2 space-y-1 list-disc text-sm">
                      <li><strong>App Name:</strong> "Mind Stylist Bookings" (or your preference)</li>
                      <li><strong>Company Name:</strong> Your business name</li>
                      <li><strong>App Description:</strong> "Automatically creates Zoom meetings for client consultations"</li>
                    </ul>
                  </li>
                  <li>Check the boxes to agree to the terms and click <strong>"Create"</strong></li>
                </ol>

                <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                  <AlertDescription className="text-sm">
                    <strong>Note:</strong> You may be asked to provide additional app information. You can use the default values for now.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-white flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <CardTitle className="font-serif text-2xl text-[#1E3A32]">
                    Set Up OAuth Credentials
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#2B2725]/80">
                  On the app info page, go to the <strong>"App Credentials"</strong> tab. You'll see your Client ID and Client Secret. Keep these safe!
                </p>

                <div className="bg-[#F9F5EF] p-6 rounded-lg border border-[#E4D9C4] space-y-3">
                  <div>
                    <label className="text-xs text-[#2B2725]/60 uppercase tracking-wide block mb-2">Redirect URL for OAuth</label>
                    <p className="text-xs text-[#2B2725]/60 mb-3">This tells Zoom where to send users after they authorize. You need to add this exact URL:</p>
                    <div className="flex items-center gap-2 bg-white p-3 rounded border border-[#D8B46B]">
                      <code className="flex-1 text-sm font-mono text-[#1E3A32] break-all">
                        {redirectUri}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(redirectUri, 'redirectUrl')}
                        className="flex-shrink-0"
                      >
                        {copied === 'redirectUrl' ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <ol className="space-y-3 ml-6 list-decimal text-[#2B2725]/80">
                  <li>Scroll down to <strong>"Redirect URL for OAuth"</strong></li>
                  <li>Paste the URL above and click <strong>"Add"</strong></li>
                  <li>Save your app credentials (they'll be on this page)</li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-white flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <CardTitle className="font-serif text-2xl text-[#1E3A32]">
                    Add Credentials to Your Booking App
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#2B2725]/80">
                  Now you'll add your Zoom credentials to this booking system. Go to your app settings and look for the environment variables or secrets section.
                </p>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    If you see an error message about Client ID...
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>"Invalid client_id: YOUR_CLIENT_ID"</strong> means your Client ID isn't set correctly in the environment.</p>
                    <p><strong>"This app has been disabled by Zoom temporarily"</strong> usually means the Zoom app review is pending or there's an issue with your credentials.</p>
                    <p className="mt-3">
                      <strong>Solution:</strong> Make sure you've entered your actual Client ID and Client Secret (from the Zoom Marketplace app credentials page), not the placeholder text.
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 ml-6 list-decimal text-[#2B2725]/80">
                  <li>In the booking app dashboard, go to <strong>Settings → Environment Variables</strong></li>
                  <li>Add these variables:
                    <div className="mt-2 space-y-2 bg-white p-3 rounded border border-[#E4D9C4] ml-4">
                      <div>
                        <p className="text-xs font-mono text-[#2B2725]/60">ZOOM_CLIENT_ID</p>
                        <p className="text-sm text-[#2B2725]/80">(paste your Client ID from Zoom Marketplace)</p>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-[#2B2725]/60">ZOOM_CLIENT_SECRET</p>
                        <p className="text-sm text-[#2B2725]/80">(paste your Client Secret from Zoom Marketplace)</p>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-[#2B2725]/60">ZOOM_ACCOUNT_ID</p>
                        <p className="text-sm text-[#2B2725]/80">(find this on your Zoom app info page under "Account ID")</p>
                      </div>
                    </div>
                  </li>
                  <li>Click <strong>"Save"</strong></li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-white flex items-center justify-center font-semibold text-sm">
                    4
                  </div>
                  <CardTitle className="font-serif text-2xl text-[#1E3A32]">
                    Authorize Zoom Access
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#2B2725]/80">
                  Now you'll authorize your booking app to create Zoom meetings on your behalf.
                </p>

                <ol className="space-y-3 ml-6 list-decimal text-[#2B2725]/80">
                  <li>Go to your booking app and look for a "Connect Zoom" or "Authorize Zoom" button</li>
                  <li>Click it and you'll be taken to Zoom to authorize the app</li>
                  <li>Review the permissions and click <strong>"Authorize"</strong></li>
                  <li>You'll be redirected back to your app</li>
                </ol>

                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-sm flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>You're all set!</strong> When you create a new appointment type, you can now enable Zoom and meetings will be automatically created for clients.
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 5 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-white flex items-center justify-center font-semibold text-sm">
                    5
                  </div>
                  <CardTitle className="font-serif text-2xl text-[#1E3A32]">
                    Test It Out
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#2B2725]/80">
                  Create a test appointment to make sure everything works.
                </p>

                <ol className="space-y-3 ml-6 list-decimal text-[#2B2725]/80">
                  <li>
                    Go to <strong>Appointment Types</strong> and create a new appointment with Zoom enabled
                  </li>
                  <li>Make a test booking for yourself</li>
                  <li>Check that the Zoom meeting link appears in the confirmation email</li>
                  <li>Try joining the meeting to verify it works</li>
                </ol>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-red-900">
                  Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">"Invalid client_id" error</h4>
                    <p className="text-sm text-red-800">
                      Make sure you've pasted the <strong>actual</strong> Client ID from your Zoom app (not the example text). Double-check for any extra spaces.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-900 mb-2">"App has been disabled by Zoom"</h4>
                    <p className="text-sm text-red-800">
                      This usually means Zoom is reviewing your app or found an issue. Check your Zoom Marketplace dashboard for notifications. You can also try creating a new app if needed.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Zoom meetings not being created</h4>
                    <p className="text-sm text-red-800 mb-2">
                      Make sure:
                    </p>
                    <ul className="text-sm text-red-800 ml-4 space-y-1 list-disc">
                      <li>Zoom is enabled on the appointment type</li>
                      <li>Your credentials are correct</li>
                      <li>You've authorized the app (Step 4)</li>
                      <li>Your Zoom account has API access enabled</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Still having issues?</h4>
                    <p className="text-sm text-red-800">
                      Contact Zoom support or reach out to the booking app support team with screenshots of the error message.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="mt-8 bg-gradient-to-br from-[#FFF9F0] to-white border-[#D8B46B]">
            <CardContent className="pt-6">
              <h3 className="font-serif text-2xl text-[#1E3A32] mb-4">
                Ready to go live?
              </h3>
              <p className="text-[#2B2725]/70 mb-6">
                Once Zoom is set up, you can:
              </p>
              <ul className="space-y-2 ml-6 list-disc text-[#2B2725]/80 mb-6">
                <li>Create appointment types with Zoom meetings enabled</li>
                <li>Configure Zoom meeting settings (waiting room, video on/off, etc.)</li>
                <li>See Zoom links in booking confirmations and calendar invites</li>
                <li>Track client attendance and meeting history</li>
              </ul>
              <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
                Go to Appointment Types →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}