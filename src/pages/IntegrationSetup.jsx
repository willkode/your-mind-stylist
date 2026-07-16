import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Calendar, Video, AlertCircle, RefreshCw, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function IntegrationSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [connectingZoom, setConnectingZoom] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isZoomConnected, setIsZoomConnected] = useState(false);
  const [importingIcal, setImportingIcal] = useState(false);
  const [icalUrl, setIcalUrl] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // Only managers/admins can access this page
      if (currentUser.role !== 'admin' && currentUser.custom_role !== 'manager') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      
      setUser(currentUser);
      setIsGoogleConnected(!!currentUser.hasGoogleCalendar);
      
      // Check if Zoom Server-to-Server OAuth is configured
      const zoomCheck = await base44.functions.invoke('checkZoomCredentials');
      setIsZoomConnected(zoomCheck.data?.isConfigured || false);

      // Check for OAuth callback success/error
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        const service = urlParams.get('service') || 'Service';
        toast.success(`${service} connected successfully!`);
        window.history.replaceState({}, '', window.location.pathname);
        // Refetch to get updated status
        setTimeout(() => fetchUser(), 500);
      } else if (urlParams.get('error')) {
        const errorMsg = urlParams.get('error');
        const details = urlParams.get('details') || urlParams.get('message');
        toast.error(`Failed: ${errorMsg}${details ? ' - ' + details : ''}`);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const response = await base44.functions.invoke('googleCalendarAuth');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        toast.error('No authorization URL received');
        setConnectingGoogle(false);
      }
    } catch (error) {
      toast.error('Failed to connect Google Calendar: ' + error.message);
      setConnectingGoogle(false);
    }
  };

  const handleConnectZoom = () => {
    toast('Zoom is configured with Server-to-Server OAuth. No user connection needed!', {
      icon: '✅',
      duration: 4000
    });
  };

  const handleSyncCalendar = async () => {
    setSyncingCalendar(true);
    try {
      const result = await base44.functions.invoke('syncGoogleCalendarToAvailability');
      if (result.data?.success) {
        const count = result.data.synced_events || 0;
        if (count > 0) {
          toast.success(`✅ Synced ${count} calendar event${count !== 1 ? 's' : ''} as blocked times! View them in Availability Management.`);
        } else {
          toast('No calendar events found in the next 30 days to block. Your calendar is clear!', {
            icon: '📅',
            duration: 5000
          });
        }
      } else {
        toast.error('Failed to sync: ' + result.data?.error);
      }
    } catch (error) {
      toast.error('Failed to sync calendar: ' + error.message);
    } finally {
      setSyncingCalendar(false);
    }
  };

  const handleDisconnect = async (service) => {
    if (!confirm(`Are you sure you want to disconnect ${service}?`)) {
      return;
    }

    try {
      if (service === 'Google Calendar') {
        await base44.auth.updateMe({
          google_calendar_access_token: null,
          google_calendar_refresh_token: null,
          google_calendar_token_expiry: null,
          hasGoogleCalendar: false
        });
        setIsGoogleConnected(false);
        toast.success(`${service} disconnected`);
      } else if (service === 'Zoom') {
        toast('Zoom uses Server-to-Server OAuth. To disconnect, remove the credentials in Settings.', {
          icon: 'ℹ️',
          duration: 5000
        });
      }
    } catch (error) {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  };

  const handleImportIcal = async () => {
    if (!icalUrl.trim()) {
      toast.error('Please enter a valid iCal URL');
      return;
    }

    setImportingIcal(true);
    try {
      const result = await base44.functions.invoke('importIcalFeed', {
        ical_url: icalUrl
      });

      if (result.data?.success) {
        const count = result.data.imported_events || 0;
        toast.success(`✅ Imported ${count} event${count !== 1 ? 's' : ''} from your iCal! They're now blocked in your availability.`);
        setIcalUrl("");
      } else {
        toast.error('Failed to import: ' + result.data?.error);
      }
    } catch (error) {
      toast.error('Failed to import iCal: ' + error.message);
    } finally {
      setImportingIcal(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F9F5EF] pt-24 flex items-center justify-center">
      <RefreshCw className="animate-spin text-[#D8B46B]" size={32} />
    </div>;
  }

  const allConnected = isGoogleConnected && isZoomConnected;

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Connect Your Services</h1>
            <p className="text-[#2B2725]/70">
              Set up your Google Calendar and Zoom to enable automatic bookings and video meetings for your clients
            </p>
          </div>

          {allConnected && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="text-green-600" />
              <AlertDescription className="text-green-800">
                ✨ All services connected! Your booking system is ready to go.
              </AlertDescription>
            </Alert>
          )}

          {/* iCal Import Card */}
          <Card className="border-[#D8B46B] mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Upload className="text-[#D8B46B]" />
                <span>Import from Apple/Acuity iCal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#2B2725]/80">
                Import your existing calendar events as blocked times to prevent double-booking. Works with any iCal feed (Acuity, Google Calendar, Apple Calendar, etc.)
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#1E3A32] mb-2">
                    iCal Feed URL
                  </label>
                  <input
                    type="text"
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    placeholder="e.g., https://calendar.google.com/calendar/ical/..."
                    className="w-full px-4 py-2 border border-[#D8B46B]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D8B46B] text-sm"
                  />
                  <div className="text-xs text-[#2B2725]/60 mt-2 space-y-1">
                    <p><strong>How to find your iCal feed:</strong></p>
                    <p>Navigate to your calendar provider's settings (Google Calendar, Apple Calendar, Acuity, etc.), enable public access, and copy the URL in ".ics" format under the "Integrate" or "Share" section.</p>
                  </div>
                </div>

                <Button
                  onClick={handleImportIcal}
                  disabled={importingIcal || !icalUrl.trim()}
                  className="w-full bg-[#D8B46B] hover:bg-[#C5A35B] text-[#1E3A32]"
                >
                  {importingIcal ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Import Events
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Google Calendar Card */}
            <Card className={`${isGoogleConnected ? 'border-green-300 bg-green-50/30' : 'border-[#D8B46B]'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className={isGoogleConnected ? "text-green-600" : "text-[#D8B46B]"} />
                    <span>Google Calendar</span>
                  </div>
                  {isGoogleConnected && <CheckCircle className="text-green-600" size={24} />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#2B2725]/80">
                  Connect your Google Calendar to sync bookings and prevent double-booking
                </p>

                <div className="space-y-2 text-xs text-[#2B2725]/70">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D8B46B]" />
                    <span>Auto-sync bookings to your calendar</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D8B46B]" />
                    <span>Block busy times from being booked</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D8B46B]" />
                    <span>Prevent double-booking</span>
                  </div>
                </div>

                {isGoogleConnected ? (
                  <div className="pt-4 border-t flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                    <Button
                      onClick={handleSyncCalendar}
                      disabled={syncingCalendar}
                      className="w-full bg-[#D8B46B] hover:bg-[#C5A35B] text-[#1E3A32]"
                    >
                      {syncingCalendar ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} className="mr-2" />
                          Sync Calendar Now
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-[#2B2725]/60 text-center">
                      Import blocked times from Google Calendar
                    </p>
                    <Button
                      onClick={() => handleDisconnect('Google Calendar')}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
                  >
                    {connectingGoogle ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Calendar size={16} className="mr-2" />
                        Connect Google Calendar
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Zoom Card */}
            <Card className={`${isZoomConnected ? 'border-green-300 bg-green-50/30' : 'border-[#D8B46B]'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className={isZoomConnected ? "text-green-600" : "text-[#D8B46B]"} />
                    <span>Zoom</span>
                  </div>
                  {isZoomConnected && <CheckCircle className="text-green-600" size={24} />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#2B2725]/80">
                  Zoom is configured at the app level - meetings are created automatically using your account
                </p>

                <div className="space-y-2 text-xs text-[#2B2725]/70">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D8B46B]" />
                    <span>Auto-generate meeting links</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D8B46B]" />
                    <span>Send links to clients automatically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D8B46B]" />
                    <span>Seamless video appointments</span>
                  </div>
                </div>

                {isZoomConnected ? (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Connected via Server-to-Server OAuth</span>
                    </div>
                    <p className="text-xs text-[#2B2725]/60">
                      Meetings will be created using your Zoom account automatically
                    </p>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-orange-600 mb-3">
                      ⚠️ Zoom credentials not configured. Add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in your app settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="bg-gradient-to-br from-[#FFF9F0] to-white border-[#D8B46B]">
            <CardHeader>
              <CardTitle className="text-xl">Quick Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-[#1E3A32] mb-2">Step 1: Connect Your Google Calendar</h4>
                <p className="text-sm text-[#2B2725]/80">
                  Click "Connect Google Calendar" and sign in with your Google account. This syncs your bookings to your personal calendar and prevents double-booking.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-[#1E3A32] mb-2">Step 2: Zoom (Already Configured)</h4>
                <p className="text-sm text-[#2B2725]/80">
                  Zoom uses Server-to-Server OAuth - no connection needed. Meeting links are created automatically for all bookings using your Zoom account.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-[#1E3A32] mb-2">Step 3: Set Your Availability</h4>
                <p className="text-sm text-[#2B2725]/80">
                  Go to Calendar Settings to configure when you're available for appointments. You can set different hours for different days.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-[#1E3A32] mb-2">Step 4: Sync Apple Calendar (Optional)</h4>
                <p className="text-sm text-[#2B2725]/80 mb-2">
                  If you use Apple Calendar, you can sync it with your Google Calendar for seamless two-way sync:
                </p>
                <ol className="text-sm text-[#2B2725]/80 space-y-2 list-decimal list-inside ml-2">
                  <li>On your Mac, open <strong>System Settings</strong> → <strong>Internet Accounts</strong></li>
                  <li>Click the <strong>+</strong> button and select <strong>Google</strong></li>
                  <li>Sign in with the same Google account you connected above</li>
                  <li>Make sure <strong>Calendars</strong> is checked</li>
                  <li>Your Google Calendar will now appear in Apple Calendar, and all bookings will sync automatically</li>
                </ol>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Having trouble?</strong> Make sure you're signing in with the same Google/Zoom account you use for your calendar and meetings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}