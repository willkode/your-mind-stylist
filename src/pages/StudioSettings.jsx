import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save, Download, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudioSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    siteName: "The Mind Stylist",
    blogEnabled: true,
    podcastEnabled: true,
    portalEnabled: true,
  });
  const [localChanges, setLocalChanges] = useState(false);

  // Load settings from current user
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.studio_settings) {
          setSettings(user.studio_settings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (newSettings) => {
      return base44.auth.updateMe({
        studio_settings: newSettings,
      });
    },
    onSuccess: () => {
      setLocalChanges(false);
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
    setLocalChanges(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <SettingsIcon size={32} className="text-[#1E3A32]" />
            <h1 className="font-serif text-4xl text-[#1E3A32]">Studio Settings</h1>
          </div>
          <p className="text-[#2B2725]/70">
            App-level settings that you, as Owner, control
          </p>
        </div>

        {/* Brand & Identity */}
        <div className="bg-white p-8 mb-6">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Brand & Identity</h2>
          <div className="space-y-6">
            <div>
              <Label>Site Name</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                className="max-w-md"
              />
            </div>
            <div>
              <Label>Primary Domain</Label>
              <Input value="yourmindstylist.com" disabled className="max-w-md" />
              <p className="text-xs text-[#2B2725]/60 mt-1">Read-only</p>
            </div>
            <div>
              <Label>Logo Upload (App-Level)</Label>
              <Button variant="outline" className="mt-2">
                Upload Logo
              </Button>
              <p className="text-xs text-[#2B2725]/60 mt-1">Recommended: PNG or SVG, max 2MB</p>
            </div>
            <div>
              <Label>Favicon Upload</Label>
              <Button variant="outline" className="mt-2">
                Upload Favicon
              </Button>
              <p className="text-xs text-[#2B2725]/60 mt-1">Recommended: ICO or PNG, 32x32px</p>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white p-8 mb-6">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Feature Flags</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Blog</Label>
                <p className="text-sm text-[#2B2725]/60">Enable/disable the blog section</p>
              </div>
              <Switch
                 checked={settings.blogEnabled}
                 onCheckedChange={(checked) => handleChange("blogEnabled", checked)}
               />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Podcast Section</Label>
                <p className="text-sm text-[#2B2725]/60">Show/hide podcast page</p>
              </div>
              <Switch
                 checked={settings.podcastEnabled}
                 onCheckedChange={(checked) => handleChange("podcastEnabled", checked)}
               />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Portal Access</Label>
                <p className="text-sm text-[#2B2725]/60">Enable/disable user portal login</p>
              </div>
              <Switch
                 checked={settings.portalEnabled}
                 onCheckedChange={(checked) => handleChange("portalEnabled", checked)}
               />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white p-8 mb-6">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Integrations</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#E4D9C4]">
              <div>
                <p className="font-medium text-[#1E3A32]">Email Provider</p>
                <p className="text-sm text-[#2B2725]/60">Base44 Email Service</p>
              </div>
              <span className="text-xs text-[#2B2725]/60">Read-only</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#E4D9C4]">
              <div>
                <p className="font-medium text-[#1E3A32]">Payment Provider</p>
                <p className="text-sm text-[#2B2725]/60">Stripe</p>
              </div>
              <span className="text-xs text-[#2B2725]/60">Read-only</span>
            </div>
          </div>
        </div>

        {/* Export / Backups */}
        <div className="bg-white p-8 mb-6">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Export & Backups</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[#2B2725]/80 mb-3">Request a data export or backup checkpoint</p>
              <div className="flex gap-3">
                <Button variant="outline">
                  <Download size={18} className="mr-2" />
                  Request Data Export
                </Button>
                <Button variant="outline">
                  <Download size={18} className="mr-2" />
                  Request Backup Checkpoint
                </Button>
              </div>
              <p className="text-xs text-[#2B2725]/60 mt-2">
                Requests are processed by platform admin/support
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
         <div className="flex justify-end">
           <Button 
             onClick={handleSave} 
             disabled={!localChanges || saveMutation.isPending}
             className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
           >
             {saveMutation.isPending ? (
               <>
                 <Loader2 size={18} className="mr-2 animate-spin" />
                 Saving...
               </>
             ) : (
               <>
                 <Save size={18} className="mr-2" />
                 Save Settings
               </>
             )}
           </Button>
         </div>
      </div>
    </div>
  );
}