import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function ZoomCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Connecting your Zoom account...');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            // Extract query params from URL (not hash since we removed #)
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');

            console.log('OAuth code:', code);
            console.log('OAuth error:', error);

            if (error) {
                console.error('OAuth error from Zoom:', error);
                setStatus('error');
                setMessage('Authorization was denied or cancelled.');
                setTimeout(() => navigate(createPageUrl('ZoomConnect')), 3000);
                return;
            }

            if (!code) {
                console.error('No authorization code in URL');
                setStatus('error');
                setMessage('No authorization code received.');
                setTimeout(() => navigate(createPageUrl('ZoomConnect')), 3000);
                return;
            }

            console.log('Calling backend with code:', code);
            
            // Call backend to exchange code for tokens
            const response = await base44.functions.invoke('zoomOAuthCallback', { code });

            console.log('Backend response:', response);

            if (response.data && response.data.success) {
                setStatus('success');
                setMessage('Zoom account connected successfully!');
                setTimeout(() => navigate(createPageUrl('ZoomConnect')), 2000);
            } else {
                console.error('Backend returned failure:', response);
                setStatus('error');
                setMessage(response.data?.error || 'Failed to connect Zoom account.');
                setTimeout(() => navigate(createPageUrl('ZoomConnect')), 3000);
            }

        } catch (error) {
            console.error('Zoom callback error details:', error);
            setStatus('error');
            setMessage(`Error: ${error.message || 'An error occurred while connecting your Zoom account.'}`);
            setTimeout(() => navigate(createPageUrl('ZoomConnect')), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-lg p-12 max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <Loader size={48} className="text-[#2D8CFF] mx-auto mb-4 animate-spin" />
                        <h2 className="text-xl font-serif text-[#1E3A32] mb-2">{message}</h2>
                        <p className="text-sm text-[#2B2725]/60">Please wait...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                        <h2 className="text-xl font-serif text-[#1E3A32] mb-2">{message}</h2>
                        <p className="text-sm text-[#2B2725]/60">Redirecting...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={48} className="text-red-600 mx-auto mb-4" />
                        <h2 className="text-xl font-serif text-[#1E3A32] mb-2">{message}</h2>
                        <p className="text-sm text-[#2B2725]/60">Redirecting back...</p>
                    </>
                )}
            </div>
        </div>
    );
}