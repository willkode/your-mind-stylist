import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ManagerSettings() {
  const [activeTab, setActiveTab] = useState("zoom");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  
  const [formData, setFormData] = useState({
    zoom_client_id: "",
    zoom_client_secret: "",
    zoom_account_id: "",
    google_client_id: "",
    google_client_secret: "",
    stripe_api_key: "",
    stripe_publishable_key: "",
  });

  const [credentialStatus, setCredentialStatus] = useState({
    zoom: null,
    google: null,
    stripe: null,
  });

  // Check which credentials are set (without showing the values)
  const checkCredentials = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('checkIntegrationStatus', {});
      setCredentialStatus(result.data);
    } catch (error) {
      console.error("Error checking credentials:", error);
      toast.error("Could not verify credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleTestIntegration = async (integration) => {
    setTesting(integration);
    try {
      const result = await base44.functions.invoke('testIntegrationCredentials', {
        integration,
        credentials: {
          zoom_client_id: formData.zoom_client_id,
          zoom_client_secret: formData.zoom_client_secret,
          zoom_account_id: formData.zoom_account_id,
          google_client_id: formData.google_client_id,
          google_client_secret: formData.google_client_secret,
          stripe_api_key: formData.stripe_api_key,
        }
      });

      if (result.data.success) {
        toast.success(`${integration} connection verified!`);
        setCredentialStatus(prev => ({
          ...prev,
          [integration]: { configured: true, valid: true }
        }));
      } else {
        toast.error(`${integration}: ${result.data.error}`);
        setCredentialStatus(prev => ({
          ...prev,
          [integration]: { configured: true, valid: false, error: result.data.error }
        }));
      }
    } catch (error) {
      toast.error(`Error testing ${integration}: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const handleSaveCredentials = async (integration) => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('updateIntegrationCredentials', {
        integration,
        credentials: formData
      });

      if (result.data.success) {
        toast.success(`${integration} credentials saved!`);
        await checkCredentials();
      } else {
        toast.error(`Failed to save credentials: ${result.data.error}`);
      }
    } catch (error) {
      toast.error(`Error saving credentials: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const CredentialStatusBadge = ({ status, integration }) => {
    if (!status) return null;
    
    if (status.configured && status.valid) {
      return (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">Connected</span>
        </div>
      );
    }
    
    if (status.configured && !status.valid) {
      return (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Invalid Credentials</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-[#2B2725]/60 bg-[#F9F5EF] px-3 py-2 rounded-lg">
        <AlertCircle size={16} />
        <span className="text-sm font-medium">Not Set</span>
      </div>
    );
  };

  const CredentialInput = ({ label, name, placeholder, value }) => (
    <div>
      <Label className="text-sm mb-2 block">{label}</Label>
      <div className="flex gap-2">
        <Input
          type={showSecrets[name] ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowSecrets(prev => ({
            ...prev,
            [name]: !prev[name]
          }))}
        >
          {showSecrets[name] ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Integration Settings</h1>
            <p className="text-[#2B2725]/70">Manage API credentials for Zoom, Google Calendar, and Stripe</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="zoom">Zoom</TabsTrigger>
              <TabsTrigger value="google">Google Calendar</TabsTrigger>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
            </TabsList>

            {/* Zoom Tab */}
            <TabsContent value="zoom">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-serif text-2xl text-[#1E3A32]">Zoom Configuration</CardTitle>
                    <p className="text-sm text-[#2B2725]/70 mt-1">Connect your Zoom account to enable video meetings</p>
                  </div>
                  <CredentialStatusBadge status={credentialStatus.zoom} integration="zoom" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm">
                      Get these credentials from <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="text-[#D8B46B] hover:underline font-medium">Zoom Marketplace</a> → Your App → App Credentials
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <CredentialInput
                      label="Client ID *"
                      name="zoom_client_id"
                      placeholder="Your Zoom Client ID"
                      value={formData.zoom_client_id}
                    />
                    
                    <CredentialInput
                      label="Client Secret *"
                      name="zoom_client_secret"
                      placeholder="Your Zoom Client Secret"
                      value={formData.zoom_client_secret}
                    />
                    
                    <CredentialInput
                      label="Account ID *"
                      name="zoom_account_id"
                      placeholder="Your Zoom Account ID"
                      value={formData.zoom_account_id}
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleTestIntegration('zoom')}
                      disabled={testing === 'zoom' || !formData.zoom_client_id}
                      variant="outline"
                      className="border-[#D8B46B] text-[#1E3A32]"
                    >
                      {testing === 'zoom' && <Loader size={16} className="mr-2 animate-spin" />}
                      Test Connection
                    </Button>
                    <Button
                      onClick={() => handleSaveCredentials('zoom')}
                      disabled={loading || !formData.zoom_client_id}
                      className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] ml-auto"
                    >
                      <Save size={16} className="mr-2" />
                      Save Credentials
                    </Button>
                  </div>

                  {credentialStatus.zoom?.error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-sm text-red-800">
                        <strong>Error:</strong> {credentialStatus.zoom.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Google Calendar Tab */}
            <TabsContent value="google">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-serif text-2xl text-[#1E3A32]">Google Calendar</CardTitle>
                    <p className="text-sm text-[#2B2725]/70 mt-1">Sync bookings to your Google Calendar</p>
                  </div>
                  <CredentialStatusBadge status={credentialStatus.google} integration="google" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm">
                      Get these from <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[#D8B46B] hover:underline font-medium">Google Cloud Console</a> → OAuth 2.0 Credentials
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <CredentialInput
                      label="Client ID *"
                      name="google_client_id"
                      placeholder="Your Google Client ID"
                      value={formData.google_client_id}
                    />
                    
                    <CredentialInput
                      label="Client Secret *"
                      name="google_client_secret"
                      placeholder="Your Google Client Secret"
                      value={formData.google_client_secret}
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleTestIntegration('google')}
                      disabled={testing === 'google' || !formData.google_client_id}
                      variant="outline"
                      className="border-[#D8B46B] text-[#1E3A32]"
                    >
                      {testing === 'google' && <Loader size={16} className="mr-2 animate-spin" />}
                      Test Connection
                    </Button>
                    <Button
                      onClick={() => handleSaveCredentials('google')}
                      disabled={loading || !formData.google_client_id}
                      className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] ml-auto"
                    >
                      <Save size={16} className="mr-2" />
                      Save Credentials
                    </Button>
                  </div>

                  {credentialStatus.google?.error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-sm text-red-800">
                        <strong>Error:</strong> {credentialStatus.google.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stripe Tab */}
            <TabsContent value="stripe">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-serif text-2xl text-[#1E3A32]">Stripe Payment Processing</CardTitle>
                    <p className="text-sm text-[#2B2725]/70 mt-1">Accept payments for bookings and courses</p>
                  </div>
                  <CredentialStatusBadge status={credentialStatus.stripe} integration="stripe" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm">
                      Get these from your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-[#D8B46B] hover:underline font-medium">Stripe Dashboard</a> → API Keys
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <CredentialInput
                      label="Secret Key *"
                      name="stripe_api_key"
                      placeholder="sk_live_... (starts with sk_live or sk_test)"
                      value={formData.stripe_api_key}
                    />
                    
                    <CredentialInput
                      label="Publishable Key *"
                      name="stripe_publishable_key"
                      placeholder="pk_live_... (starts with pk_live or pk_test)"
                      value={formData.stripe_publishable_key}
                    />
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-sm">
                      <strong>Important:</strong> Use your <strong>Live</strong> keys for production, or <strong>Test</strong> keys for testing. Never share your secret key!
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleTestIntegration('stripe')}
                      disabled={testing === 'stripe' || !formData.stripe_api_key}
                      variant="outline"
                      className="border-[#D8B46B] text-[#1E3A32]"
                    >
                      {testing === 'stripe' && <Loader size={16} className="mr-2 animate-spin" />}
                      Test Connection
                    </Button>
                    <Button
                      onClick={() => handleSaveCredentials('stripe')}
                      disabled={loading || !formData.stripe_api_key}
                      className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] ml-auto"
                    >
                      <Save size={16} className="mr-2" />
                      Save Credentials
                    </Button>
                  </div>

                  {credentialStatus.stripe?.error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-sm text-red-800">
                        <strong>Error:</strong> {credentialStatus.stripe.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Help Section */}
          <Card className="mt-8 bg-gradient-to-br from-[#FFF9F0] to-white border-[#D8B46B]">
            <CardContent className="pt-6">
              <h3 className="font-serif text-lg text-[#1E3A32] mb-3">Need help?</h3>
              <ul className="space-y-2 text-sm text-[#2B2725]/80">
                <li>• <a href="/zoom-setup" className="text-[#D8B46B] hover:underline">Zoom setup guide</a> - Step-by-step instructions</li>
                <li>• Check that you're using the correct API keys (not test keys in production)</li>
                <li>• Make sure credentials have the right permissions/scopes enabled</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}