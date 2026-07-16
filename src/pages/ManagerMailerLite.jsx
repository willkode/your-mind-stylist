import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Send, Users, Plus, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManagerMailerLite() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("groups");
  
  // Subscriber form
  const [subscriberForm, setSubscriberForm] = useState({
    email: "",
    name: "",
    groupId: ""
  });

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    subject: "",
    content: "",
    groups: []
  });

  // Group form
  const [groupForm, setGroupForm] = useState({
    name: ""
  });

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['mailerlite-groups'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('mailerLiteGetGroups', {});
      return data;
    }
  });

  // Add subscriber mutation
  const addSubscriberMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await base44.functions.invoke('mailerLiteAddSubscriber', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mailerlite-groups']);
      setSubscriberForm({ email: "", name: "", groupId: "" });
    }
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await base44.functions.invoke('mailerLiteCreateGroup', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mailerlite-groups']);
      setGroupForm({ name: "" });
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await base44.functions.invoke('mailerLiteSendCampaign', formData);
      return data;
    },
    onSuccess: () => {
      setCampaignForm({ subject: "", content: "", groups: [] });
    }
  });

  const handleAddSubscriber = (e) => {
    e.preventDefault();
    addSubscriberMutation.mutate(subscriberForm);
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    createGroupMutation.mutate(groupForm);
  };

  const handleSendCampaign = (e) => {
    e.preventDefault();
    sendCampaignMutation.mutate(campaignForm);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#1E3A32] mb-2">
            MailerLite Management
          </h1>
          <p className="text-[#2B2725]/70">
            Manage email subscribers, groups, and campaigns
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="groups">
              <Users className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Mail className="w-4 h-4 mr-2" />
              Add Subscriber
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Send className="w-4 h-4 mr-2" />
              Send Campaign
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Group Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Group
                  </CardTitle>
                  <CardDescription>
                    Groups are used to organize subscribers and trigger automations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ name: e.target.value })}
                        placeholder="e.g., Masterclass Signups"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                    </Button>
                    {createGroupMutation.isSuccess && (
                      <p className="text-green-600 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Group created successfully!
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Existing Groups */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Groups</CardTitle>
                  <CardDescription>
                    {groupsLoading ? 'Loading...' : `${groupsData?.groups?.length || 0} groups`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {groupsLoading ? (
                    <p>Loading groups...</p>
                  ) : (
                    <div className="space-y-2">
                      {groupsData?.groups?.map((group) => (
                        <div
                          key={group.id}
                          className="p-3 bg-[#F9F5EF] rounded-lg border border-[#E4D9C4]"
                        >
                          <p className="font-medium text-[#1E3A32]">{group.name}</p>
                          <p className="text-sm text-[#2B2725]/60">
                            {group.active_count || 0} active subscribers
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Add Subscriber Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle>Add Subscriber</CardTitle>
                <CardDescription>
                  Manually add a subscriber to your MailerLite account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSubscriber} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={subscriberForm.email}
                      onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                      placeholder="subscriber@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={subscriberForm.name}
                      onChange={(e) => setSubscriberForm({ ...subscriberForm, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addSubscriberMutation.isPending}
                  >
                    {addSubscriberMutation.isPending ? 'Adding...' : 'Add Subscriber'}
                  </Button>
                  {addSubscriberMutation.isSuccess && (
                    <p className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Subscriber added successfully!
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Campaign Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Send Email Campaign</CardTitle>
                <CardDescription>
                  Create and send an email campaign to your subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendCampaign} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      placeholder="Your email subject"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Email Content (HTML) *</Label>
                    <Textarea
                      id="content"
                      value={campaignForm.content}
                      onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                      placeholder="<p>Your email content here...</p>"
                      className="min-h-[200px] font-mono text-sm"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={sendCampaignMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendCampaignMutation.isPending ? 'Sending...' : 'Create Campaign'}
                  </Button>
                  {sendCampaignMutation.isSuccess && (
                    <p className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Campaign created successfully!
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Automation Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Automated Tag & Group Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">
              App events automatically tag subscribers in MailerLite and add them to groups to trigger automations:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-blue-800">
              <div>
                <p className="font-semibold mb-2">Lead Events</p>
                <ul className="space-y-1 text-sm">
                  <li>• Masterclass signup → <code>lead_masterclass</code> + <em>Masterclass Follow-up</em> group</li>
                  <li>• Lead magnet download → <code>lead_magnet</code></li>
                  <li>• Contact form → <code>lead_contact</code></li>
                  <li>• Consultation request → <code>lead_consultation</code></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Purchase Events</p>
                <ul className="space-y-1 text-sm">
                  <li>• Booking completed → <code>purchased_private</code></li>
                  <li>• Course purchased → <code>purchased_course</code></li>
                  <li>• Products → product-specific tags</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Engagement Events</p>
                <ul className="space-y-1 text-sm">
                  <li>• Course/lesson completed → <code>active_learner</code></li>
                  <li>• Certificate earned → <code>certified_student</code></li>
                  <li>• Audio/style pause → media-specific tags</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Lifecycle Events</p>
                <ul className="space-y-1 text-sm">
                  <li>• User registered → <em>Welcome Sequence</em> group</li>
                  <li>• Inactive 30/60d → <em>Re-engagement</em> group</li>
                  <li>• Subscription cancelled → <em>Win-back</em> group</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-4 border-t border-blue-200 pt-3">
              <strong>Required:</strong> Create these groups in your MailerLite dashboard and attach automation workflows to them: <em>Masterclass Follow-up, Welcome Sequence, Re-engagement, Win-back, PV Onboarding, Post-Consultation Nurture, Post-Course Follow-up</em>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}