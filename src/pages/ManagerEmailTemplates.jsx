import React, { useState, useRef, useCallback } from "react";
import ReactQuill from "react-quill";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Edit, Save, X, Send, PlusCircle, Tag, Eye, Code } from "lucide-react";
import { toast } from "react-hot-toast";

const DEFAULT_TEMPLATES = [
  {
    key: "booking_confirmation_client",
    name: "Booking Confirmation (Client)",
    category: "user_notification",
    subject: "Your session is confirmed — {{appointment_type}}",
    body: `Hi {{user_name}},\n\nYour session has been confirmed!\n\n📅 Date & Time: {{scheduled_date}}\n🎯 Service: {{appointment_type}}\n\n{{zoom_details}}\n\nIf you need to reschedule or have any questions, please reply to this email.\n\nLooking forward to our time together,\nRoberta`,
    variables: ["user_name", "appointment_type", "scheduled_date", "zoom_details"],
    active: true,
  },
  {
    key: "booking_confirmation_manager",
    name: "Booking Confirmation (Manager)",
    category: "manager_notification",
    subject: "New booking: {{user_name}} — {{appointment_type}}",
    body: `New booking received!\n\nClient: {{user_name}} ({{user_email}})\nService: {{appointment_type}}\nDate: {{scheduled_date}}\nPhone: {{client_phone}}\n\nView booking in dashboard: {{admin_link}}`,
    variables: ["user_name", "user_email", "appointment_type", "scheduled_date", "client_phone", "admin_link"],
    active: true,
  },
  {
    key: "reminder_24h",
    name: "24-Hour Reminder",
    category: "user_notification",
    subject: "Reminder: Your session tomorrow — {{appointment_type}}",
    body: `Hi {{user_name}},\n\nJust a friendly reminder that your session is tomorrow!\n\n📅 Date & Time: {{scheduled_date}}\n🎯 Service: {{appointment_type}}\n\n{{zoom_details}}\n\nSee you soon,\nRoberta`,
    variables: ["user_name", "appointment_type", "scheduled_date", "zoom_details"],
    active: true,
  },
  {
    key: "pocket_mindset_purchase",
    name: "Pocket Mindset™ Purchase Confirmation",
    category: "user_notification",
    subject: "Welcome to Pocket Mindset™ — Your Access Details Inside",
    body: `Hi {{user_name}},\n\nHere is the information you need to set up your Pocket Mindset™ account.\n\n📱 Download the app from the App Store or Google Play.\n\n1. Select "New Account"\n2. Go to the Browse tab and enroll in courses\n3. Enter access code: 935384\n\nTwo content types available:\n• 5 Core Courses (7–55 days)\n• 3 Wellbeing Programs (anytime, any order)\n\nEnjoy!\n\nRoberta`,
    variables: ["user_name"],
    active: true,
  },
  {
    key: "purchase_confirmation",
    name: "Purchase Confirmation",
    category: "user_notification",
    subject: "Your purchase is confirmed — {{product_name}}",
    body: `Hi {{user_name}},\n\nThank you for your purchase!\n\nProduct: {{product_name}}\nAmount: {{amount}}\n\nYou can access your purchase from your dashboard: {{dashboard_link}}\n\nIf you have any questions, reply to this email.\n\nRoberta`,
    variables: ["user_name", "product_name", "amount", "dashboard_link"],
    active: true,
  },
  {
    key: "intake_form_reminder",
    name: "Intake Form Reminder",
    category: "user_notification",
    subject: "Please complete your intake form before our session",
    body: `Hi {{user_name}},\n\nYour upcoming session is on {{scheduled_date}}. Before we meet, please take a few minutes to complete your intake form:\n\n{{intake_form_link}}\n\nThis helps me prepare the best experience for you.\n\nSee you soon,\nRoberta`,
    variables: ["user_name", "scheduled_date", "intake_form_link"],
    active: true,
  },
];

// Rich text modules for ReactQuill
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header", "bold", "italic", "underline",
  "color", "background", "list", "bullet", "link",
];

export default function ManagerEmailTemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [viewMode, setViewMode] = useState("visual"); // "visual" | "html"
  const quillRef = useRef(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () => base44.entities.EmailTemplate.list(),
  });

  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      for (const tpl of DEFAULT_TEMPLATES) {
        const existing = templates.find(t => t.key === tpl.key);
        if (!existing) {
          await base44.entities.EmailTemplate.create(tpl);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Templates seeded successfully!");
    } catch (e) {
      toast.error("Failed to seed templates: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template updated");
      setEditMode(false);
      setSelectedTemplate(null);
    },
    onError: (error) => toast.error(error.message || "Failed to update template"),
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: ({ template_key, recipient }) =>
      base44.functions.invoke("sendTemplatedEmail", {
        template_key,
        recipient,
        variables: generateTestVariables(selectedTemplate)
      }),
    onSuccess: () => {
      toast.success("Test email sent");
      setTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error) => toast.error(error.message || "Failed to send test email"),
  });

  const generateTestVariables = (template) => {
    const testVars = {};
    template.variables?.forEach(v => {
      switch (v) {
        case "name":
          testVars[v] = "John Doe";
          break;
        case "email":
          testVars[v] = "john@example.com";
          break;
        case "login_link":
        case "dashboard_link":
        case "reset_link":
        case "verification_link":
        case "admin_link":
          testVars[v] = "https://yourmindstylist.com/app/dashboard";
          break;
        case "product_name":
          testVars[v] = "Toolkit Module";
          break;
        case "timestamp":
          testVars[v] = new Date().toLocaleDateString();
          break;
        case "count":
          testVars[v] = "3";
          break;
        default:
          testVars[v] = `[${v}]`;
      }
    });
    return testVars;
  };

  const insertVariable = useCallback((varName) => {
    const tag = `{{${varName}}}`;
    if (viewMode === "visual" && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      editor.insertText(range ? range.index : editor.getLength(), tag);
    } else {
      // For HTML mode, append to body
      setEditedTemplate(prev => ({ ...prev, body: (prev.body || "") + tag }));
    }
  }, [viewMode]);

  const handleEditClick = (template) => {
    setSelectedTemplate(template);
    setEditedTemplate({ ...template });
    setEditMode(true);
    setViewMode("visual");
  };

  const handleSave = () => {
    updateTemplateMutation.mutate({
      id: editedTemplate.id,
      data: {
        subject: editedTemplate.subject,
        body: editedTemplate.body,
        active: editedTemplate.active,
      },
    });
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedTemplate(null);
    setSelectedTemplate(null);
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }
    sendTestEmailMutation.mutate({
      template_key: selectedTemplate.key,
      recipient: testEmail,
    });
  };

  const categorizedTemplates = {
    manager_notification: templates.filter(t => t.category === "manager_notification"),
    user_notification: templates.filter(t => t.category === "user_notification"),
    admin_notification: templates.filter(t => t.category === "admin_notification"),
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Email Templates</h1>
            <p className="text-[#2B2725]/70">
              Manage notification templates for the entire platform
            </p>
          </div>
          <Button
            onClick={handleSeedTemplates}
            disabled={seeding}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
          >
            <PlusCircle size={16} className="mr-2" />
            {seeding ? "Adding..." : "Add Missing Templates"}
          </Button>
        </div>

        {templates.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-lg border border-[#E4D9C4]">
            <Mail size={48} className="mx-auto text-[#D8B46B] mb-4" />
            <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">No templates yet</h3>
            <p className="text-[#2B2725]/60 mb-6">Click "Add Missing Templates" to populate the standard set including Pocket Mindset™, booking confirmations, reminders, and more.</p>
            <Button onClick={handleSeedTemplates} disabled={seeding} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
              <PlusCircle size={16} className="mr-2" />
              {seeding ? "Adding..." : "Add Missing Templates"}
            </Button>
          </div>
        )}

        <Tabs defaultValue="manager_notification" className="space-y-6">
          <TabsList>
            <TabsTrigger value="manager_notification">Manager Notifications</TabsTrigger>
            <TabsTrigger value="user_notification">User Notifications</TabsTrigger>
            <TabsTrigger value="admin_notification">Admin Notifications</TabsTrigger>
          </TabsList>

          {Object.entries(categorizedTemplates).map(([category, categoryTemplates]) => (
            <TabsContent key={category} value={category}>
              <div className="grid md:grid-cols-2 gap-6">
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className={!template.active ? "opacity-60" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            Key: <code className="text-xs bg-[#E4D9C4] px-1 rounded">{template.key}</code>
                          </CardDescription>
                        </div>
                        <Badge variant={template.active ? "default" : "secondary"}>
                          {template.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-[#2B2725]/60 mb-1">Subject:</p>
                          <p className="text-sm font-medium">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#2B2725]/60 mb-1">Variables:</p>
                          <div className="flex flex-wrap gap-2">
                            {template.variables?.map((v) => (
                              <Badge key={v} variant="outline" className="text-xs">
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(template)}
                            className="flex-1"
                          >
                            <Edit size={14} className="mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setTestDialogOpen(true);
                            }}
                            className="flex-1"
                          >
                            <Send size={14} className="mr-2" />
                            Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editMode} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {editedTemplate?.name}</DialogTitle>
          </DialogHeader>

          {editedTemplate && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editedTemplate.active}
                  onCheckedChange={(checked) =>
                    setEditedTemplate({ ...editedTemplate, active: checked })
                  }
                />
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  value={editedTemplate.subject}
                  onChange={(e) =>
                    setEditedTemplate({ ...editedTemplate, subject: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              {/* Variable Inserter */}
              {editedTemplate.variables?.length > 0 && (
                <div className="bg-[#F9F5EF] border border-[#E4D9C4] rounded-lg p-3">
                  <p className="text-xs font-medium text-[#1E3A32] mb-2 flex items-center gap-1">
                    <Tag size={12} />
                    Insert a variable — click to add it to your email:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {editedTemplate.variables?.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="text-xs bg-white border border-[#D8B46B] text-[#1E3A32] px-2 py-1 rounded hover:bg-[#D8B46B]/10 transition-colors font-mono"
                        title={`Click to insert {{${v}}} into your email`}
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#2B2725]/50 mt-2">
                    These will be replaced with real values when the email is sent (e.g. <code className="bg-white px-1 rounded">{"{{user_name}}"}</code> becomes "Jane Smith").
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Email Body</Label>
                  <div className="flex gap-1 border border-[#E4D9C4] rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewMode("visual")}
                      className={`text-xs px-3 py-1 flex items-center gap-1 transition-colors ${viewMode === "visual" ? "bg-[#1E3A32] text-white" : "bg-white text-[#2B2725]/60 hover:bg-[#F9F5EF]"}`}
                    >
                      <Eye size={12} /> Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("html")}
                      className={`text-xs px-3 py-1 flex items-center gap-1 transition-colors ${viewMode === "html" ? "bg-[#1E3A32] text-white" : "bg-white text-[#2B2725]/60 hover:bg-[#F9F5EF]"}`}
                    >
                      <Code size={12} /> HTML
                    </button>
                  </div>
                </div>

                {viewMode === "visual" ? (
                  <div className="border border-[#E4D9C4] rounded-md overflow-hidden">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={editedTemplate.body}
                      onChange={(value) => setEditedTemplate({ ...editedTemplate, body: value })}
                      modules={quillModules}
                      formats={quillFormats}
                      style={{ minHeight: "280px" }}
                    />
                  </div>
                ) : (
                  <textarea
                    value={editedTemplate.body}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, body: e.target.value })}
                    className="w-full min-h-[320px] font-mono text-xs border border-[#E4D9C4] rounded-md p-3 bg-[#F9F5EF] focus:outline-none focus:ring-1 focus:ring-[#1E3A32]"
                    spellCheck={false}
                  />
                )}
                <p className="text-[11px] text-[#2B2725]/40 mt-1">Use the Visual editor for easy formatting. Switch to HTML if you need to paste in a custom email template.</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateTemplateMutation.isPending}
                  className="flex-1"
                >
                  <Save size={16} className="mr-2" />
                  {updateTemplateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Send to:</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-2"
              />
            </div>

            <p className="text-sm text-[#2B2725]/70">
              This will send the email with sample data to test how it looks.
            </p>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSendTest}
                disabled={sendTestEmailMutation.isPending}
                className="flex-1"
              >
                <Send size={16} className="mr-2" />
                {sendTestEmailMutation.isPending ? "Sending..." : "Send Test"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTestDialogOpen(false);
                  setTestEmail("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}