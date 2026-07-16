import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { TriggerHelpTooltip } from "./SequenceHelpTooltips";

const TRIGGER_GROUPS = [
  {
    group: "Common",
    items: [
      { key: "manual", label: "Manual Enrollment" },
      { key: "signup", label: "User Signup" },
      { key: "product_purchase", label: "Product Purchase" },
    ],
  },
  {
    group: "Events & Bookings",
    items: [
      { key: "masterclass_signup", label: "Masterclass Signup" },
      { key: "booking_completed", label: "Booking Completed" },
      { key: "consultation_submitted", label: "Consultation Submitted" },
      { key: "webinar_registered", label: "Webinar Registered" },
    ],
  },
  {
    group: "Courses",
    items: [
      { key: "course_started", label: "Course Started" },
      { key: "course_completed", label: "Course Completed" },
    ],
  },
  {
    group: "Lead Nurturing",
    items: [
      { key: "lead_magnet_download", label: "Lead Magnet Download" },
      { key: "tag_added", label: "Tag Added to Lead" },
      { key: "form_submitted", label: "Form Submitted" },
    ],
  },
  {
    group: "Re-engagement",
    items: [
      { key: "abandoned_cart", label: "Abandoned Cart" },
      { key: "inactive_user", label: "Inactive User" },
    ],
  },
];

const TRIGGER_LABELS = Object.fromEntries(
  TRIGGER_GROUPS.flatMap(g => g.items.map(i => [i.key, i.label]))
);

const TRIGGER_DESCRIPTIONS = {
  manual: "Manually enroll users from the Client Hub or via API",
  signup: "Automatically enroll when a new user signs up",
  masterclass_signup: "Enroll when someone registers for a free masterclass",
  product_purchase: "Enroll after purchasing a specific product — great for thank-you & onboarding series",
  booking_completed: "Enroll after completing a booking/session",
  course_started: "Enroll when a user starts a specific course",
  course_completed: "Enroll when a user completes a specific course",
  abandoned_cart: "Re-engage users who abandoned checkout",
  inactive_user: "Re-engage users who haven't been active",
  lead_magnet_download: "Enroll when someone downloads a free resource (PDF, guide, etc.)",
  consultation_submitted: "Enroll when someone submits a consultation intake form",
  webinar_registered: "Enroll when someone registers for a webinar",
  tag_added: "Enroll when a specific tag is added to a lead — useful for segmented follow-ups",
  form_submitted: "Enroll when someone submits a contact or application form",
};

// Triggers that need a product picker
const PRODUCT_TRIGGERS = ["product_purchase"];
// Triggers that need a course picker
const COURSE_TRIGGERS = ["course_started", "course_completed"];
// Triggers that need a lead magnet picker
const LEAD_MAGNET_TRIGGERS = ["lead_magnet_download"];
// Triggers that need a tag input
const TAG_TRIGGERS = ["tag_added"];
// Triggers that need a webinar picker
const WEBINAR_TRIGGERS = ["webinar_registered"];

export default function TriggerConfigPanel({ triggerType, triggerConditions, onTriggerTypeChange, onConditionsChange }) {
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-trigger"],
    queryFn: () => base44.entities.Product.filter({ status: "published" }, "name", 50),
    enabled: PRODUCT_TRIGGERS.includes(triggerType),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses-for-trigger"],
    queryFn: () => base44.entities.Course.filter({ status: "published" }, "title", 50),
    enabled: COURSE_TRIGGERS.includes(triggerType),
  });

  const { data: leadMagnets = [] } = useQuery({
    queryKey: ["leadmagnets-for-trigger"],
    queryFn: () => base44.entities.LeadMagnet.filter({ active: true }, "title", 50),
    enabled: LEAD_MAGNET_TRIGGERS.includes(triggerType),
  });

  const { data: webinars = [] } = useQuery({
    queryKey: ["webinars-for-trigger"],
    queryFn: () => base44.entities.Webinar.filter({ status: "published" }, "title", 50),
    enabled: WEBINAR_TRIGGERS.includes(triggerType),
  });

  const needsProduct = PRODUCT_TRIGGERS.includes(triggerType);
  const needsCourse = COURSE_TRIGGERS.includes(triggerType);
  const needsInactiveDays = triggerType === "inactive_user";
  const needsLeadMagnet = LEAD_MAGNET_TRIGGERS.includes(triggerType);
  const needsTag = TAG_TRIGGERS.includes(triggerType);
  const needsWebinar = WEBINAR_TRIGGERS.includes(triggerType);

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-[#D8B46B]" /> Trigger Type
          <TriggerHelpTooltip />
        </Label>
        <Select value={triggerType} onValueChange={onTriggerTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_GROUPS.map((group) => (
              <React.Fragment key={group.group}>
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#2B2725]/40 font-semibold">{group.group}</div>
                {group.items.map((item) => (
                  <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[#2B2725]/50 mt-1">{TRIGGER_DESCRIPTIONS[triggerType]}</p>
      </div>

      {/* Product picker */}
      {needsProduct && (
        <div>
          <Label>Trigger Product</Label>
          <Select
            value={triggerConditions?.product_id || "any"}
            onValueChange={(v) => onConditionsChange({ ...triggerConditions, product_id: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any product purchase</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Course picker */}
      {needsCourse && (
        <div>
          <Label>Trigger Course</Label>
          <Select
            value={triggerConditions?.course_id || "any"}
            onValueChange={(v) => onConditionsChange({ ...triggerConditions, course_id: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any course</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lead Magnet picker */}
      {needsLeadMagnet && (
        <div>
          <Label>Trigger Lead Magnet</Label>
          <Select
            value={triggerConditions?.lead_magnet_id || "any"}
            onValueChange={(v) => onConditionsChange({ ...triggerConditions, lead_magnet_id: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any lead magnet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any lead magnet download</SelectItem>
              {leadMagnets.map((lm) => (
                <SelectItem key={lm.id} value={lm.id}>{lm.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Webinar picker */}
      {needsWebinar && (
        <div>
          <Label>Trigger Webinar</Label>
          <Select
            value={triggerConditions?.webinar_id || "any"}
            onValueChange={(v) => onConditionsChange({ ...triggerConditions, webinar_id: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any webinar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any webinar registration</SelectItem>
              {webinars.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tag input */}
      {needsTag && (
        <div>
          <Label>Tag Name</Label>
          <Input
            value={triggerConditions?.tag_name || ""}
            onChange={(e) => onConditionsChange({ ...triggerConditions, tag_name: e.target.value })}
            placeholder="e.g., VIP, Interested-LENS, Webinar-Attendee"
            className="mt-1"
          />
          <p className="text-xs text-[#2B2725]/50 mt-1">Enter the exact tag name. When this tag is added to a lead, they'll be enrolled.</p>
        </div>
      )}

      {/* Inactive days */}
      {needsInactiveDays && (
        <div>
          <Label>Days of Inactivity</Label>
          <Input
            type="number"
            min={1}
            value={triggerConditions?.inactive_days || 30}
            onChange={(e) => onConditionsChange({ ...triggerConditions, inactive_days: parseInt(e.target.value) || 30 })}
            className="mt-1 w-32"
          />
          <p className="text-xs text-[#2B2725]/50 mt-1">Enroll users after this many days of no activity</p>
        </div>
      )}
    </div>
  );
}