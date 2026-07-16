import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Video, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ZoomConnect() {
    // Set auth layout
    if (typeof window !== 'undefined') {
        window.__USE_AUTH_LAYOUT = true;
    }

    const [user, setUser] = useState(null);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (error) {
            console.error('Auth error:', error);
            setUser(null);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            // Get Zoom client ID from backend
            const response = await base44.functions.invoke('getZoomClientId');
            const ZOOM_CLIENT_ID = response.data.client_id;
            const redirectUri = `${window.location.origin}/ZoomCallback`;
            const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
            window.top.location.href = authUrl;
        } catch (error) {
            console.error('Error connecting Zoom:', error);
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await base44.auth.updateMe({
                zoom_access_token: null,
                zoom_refresh_token: null,
                zoom_token_expires_at: null,
                zoom_connected: false,
                hasZoom: false
            });
            await loadUser();
        } catch (error) {
            console.error('Error disconnecting Zoom:', error);
        }
    };

    if (user === undefined) {
        return <div className="p-6">Loading...</div>;
    }

    if (user === null) {
        return (
            <div className="min-h-screen bg-[#F9F5EF] py-12 px-6 flex items-center justify-center">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <XCircle size={24} className="text-red-600" />
                        <h1 className="text-xl font-serif text-[#1E3A32]">Authentication Required</h1>
                    </div>
                    <p className="text-[#2B2725]/70">Please log in to connect your Zoom account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
            <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Video size={32} className="text-[#2D8CFF]" />
                    <h1 className="text-2xl font-serif text-[#1E3A32]">Zoom Integration</h1>
                </div>

                {(user.zoom_connected || user.hasZoom) ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                            <CheckCircle size={24} className="text-green-600" />
                            <div>
                                <p className="font-medium text-green-900">Zoom Connected</p>
                                <p className="text-sm text-green-700">
                                    Your Zoom account is connected and ready to create meetings.
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-medium text-[#1E3A32] mb-2">How it works:</h3>
                            <ul className="text-sm text-[#2B2725]/70 space-y-2 list-disc list-inside">
                                <li>When clients book sessions, Zoom meetings are created automatically</li>
                                <li>Meetings are created in your personal Zoom account</li>
                                <li>Both you and the client receive meeting links via email</li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleDisconnect}
                            variant="outline"
                            className="w-full"
                        >
                            Disconnect Zoom
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                            <AlertCircle size={24} className="text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-900">Zoom Not Connected</p>
                                <p className="text-sm text-yellow-700">
                                    Connect your Zoom account to automatically create meetings for bookings.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium text-[#1E3A32] mb-2">Why connect Zoom?</h3>
                            <ul className="text-sm text-[#2B2725]/70 space-y-2 list-disc list-inside mb-6">
                                <li>Automatically create Zoom meetings when clients book sessions</li>
                                <li>Send meeting links to clients immediately after payment</li>
                                <li>Manage all your sessions from one place</li>
                                <li>Professional, seamless experience for your clients</li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="w-full bg-[#2D8CFF] hover:bg-[#2D8CFF]/90"
                        >
                            {connecting ? 'Connecting...' : 'Connect Your Zoom Account'}
                        </Button>

                        <p className="text-xs text-[#2B2725]/50 text-center">
                            You'll be redirected to Zoom to authorize access. We only request permissions to create meetings on your behalf.
                        </p>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}