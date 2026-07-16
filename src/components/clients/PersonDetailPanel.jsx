import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Phone, MapPin, Calendar, BookOpen,
  ShoppingBag, Send, GraduationCap, Loader2, RefreshCw, ExternalLink, Clock, Pencil, Tag,
  UserX, Archive, CheckCircle, Trash2
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import PersonStatusBadge, { getPersonStatus } from "./PersonStatusBadge";
import PersonSummaryLine from "./PersonSummaryLine";
import SuggestedNextStep from "./SuggestedNextStep";
import ManualEnrollmentModal from "../manager/ManualEnrollmentModal";
import SendIndividualEmailDialog from "./SendIndividualEmailDialog";
import LeadDetailsDialog from "./LeadDetailsDialog";
import InviteEmailPreview from "./InviteEmailPreview";
import EditUserDialog from "./EditUserDialog";
import EmailHistorySection from "./EmailHistorySection";
import PersonBookingHistory from "./PersonBookingHistory";
import DeactivateUserDialog from "./DeactivateUserDialog";
import SafeDeleteUserDialog from "./SafeDeleteUserDialog";
import ArchiveLeadDialog from "./ArchiveLeadDialog";
import OptOutLeadDialog from "./OptOutLeadDialog";
import PendingAccessGrantsSection from "./PendingAccessGrantsSection";

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.15em] text-[#2B2725]/50 font-semibold mb-2">
      {children}
    </p>
  );
}

function EmptyState({ text }) {
  return <p className="text-sm text-[#2B2725]/40 italic">{text}</p>;
}

export default function PersonDetailPanel({ open, onOpenChange, email, name }) {
  const queryClient = useQueryClient();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [invitePreviewOpen, setInvitePreviewOpen] = useState(false);
  const [invitePreviewMode, setInvitePreviewMode] = useState("invite"); // "invite" or "invite_enroll"
  const [statusAction, setStatusAction] = useState(null); // "deactivate" | "archive" | "reactivate"
  const [safeDeleteOpen, setSafeDeleteOpen] = useState(false);
  const [archiveLeadAction, setArchiveLeadAction] = useState(null);
  const [optOutDialogOpen, setOptOutDialogOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // Get current user for self-protection
  React.useEffect(() => {
    base44.auth.me().then(u => setCurrentUserEmail(u?.email)).catch(() => {});
  }, []);

  // Look up user by email
  const { data: userData } = useQuery({
    queryKey: ["person-user", email],
    queryFn: async () => {
      if (!email) return null;
      const res = await base44.functions.invoke("inviteUserToApp", {
        email: email.toLowerCase(),
        checkOnly: true,
      });
      if (res.data?.userExists) {
        // Fetch full user record
        const allUsers = await base44.functions.invoke("getAllUsers");
        const users = allUsers.data?.users || [];
        return users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
      }
      return null;
    },
    enabled: open && !!email,
  });

  // Look up lead by email
  const { data: leadData } = useQuery({
    queryKey: ["person-lead", email],
    queryFn: async () => {
      if (!email) return null;
      const leads = await base44.entities.Lead.filter({ email: email.toLowerCase() });
      return leads.length > 0 ? leads[0] : null;
    },
    enabled: open && !!email,
  });

  // Fetch bookings for this person
  const { data: bookings = [] } = useQuery({
    queryKey: ["person-bookings", email],
    queryFn: async () => {
      if (!email) return [];
      return base44.entities.Booking.filter({ user_email: email.toLowerCase() });
    },
    enabled: open && !!email,
  });

  // Fetch course enrollments if user exists
  const { data: enrollments = [] } = useQuery({
    queryKey: ["person-enrollments", userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      const res = await base44.functions.invoke("getUserEnrollments", {
        email: userData.email,
      });
      return res.data?.enrollments || [];
    },
    enabled: open && !!userData?.id,
  });

  // Fetch courses for enrollment names
  const { data: courses = [] } = useQuery({
    queryKey: ["all-courses-lookup"],
    queryFn: () => base44.entities.Course.list(),
    enabled: open && enrollments.length > 0,
  });

  const personStatus = getPersonStatus({ user: userData, lead: leadData, enrollments });

  // Derive display name: prefer first_name+last_name, fallback to full_name, then lead
  const derivedFullName = userData?.first_name
    ? `${userData.first_name} ${userData.last_name || ""}`.trim()
    : userData?.full_name || name || (leadData?.first_name ? `${leadData.first_name} ${leadData.last_name || ""}`.trim() : leadData?.full_name || "");
  const displayName = derivedFullName || email;
  const displayUsername = userData?.username || (userData?.email ? userData.email.split("@")[0] : null);
  const nameIsMissing = !userData?.first_name && !userData?.full_name && !leadData?.first_name && !leadData?.full_name && !name;
  const phone = userData?.phone || leadData?.phone || null;

  // Address — prefer user data, fallback to lead data
  const address = userData?.address_line1 || userData?.city
    ? {
        line1: userData.address_line1,
        line2: userData.address_line2,
        city: userData.city,
        state: userData.state,
        zip: userData.zip,
        country: userData.country,
      }
    : leadData
    ? {
        line1: leadData.address_line1,
        line2: leadData.address_line2,
        city: leadData.city,
        state: leadData.state,
        zip: leadData.zip,
        country: leadData.country,
      }
    : null;
  const hasAddress = address && (address.line1 || address.city);

  // Fetch actual purchased products from user record
  const { data: purchasedProducts = [] } = useQuery({
    queryKey: ["person-purchased-products", userData?.id],
    queryFn: async () => {
      if (!userData?.purchased_product_ids?.length) return [];
      const allProducts = await base44.entities.Product.list();
      return allProducts.filter(p => userData.purchased_product_ids.includes(p.id));
    },
    enabled: open && !!userData?.purchased_product_ids?.length,
  });

  // Purchased products from lead (legacy/fallback)
  const whatBought = leadData?.what_they_bought;

  const handleInvite = () => {
    setInvitePreviewMode("invite");
    setInvitePreviewOpen(true);
  };

  const handleConfirmInvite = async ({ subject, body }) => {
    setInviting(true);
    try {
      await base44.functions.invoke("inviteUserToApp", {
        email: email.toLowerCase(),
        role: "user",
        brandedSubject: subject,
        brandedBody: body,
      });
      toast.success("Invite sent! They'll receive a branded email from Roberta, followed by an account setup email.");
      queryClient.invalidateQueries({ queryKey: ["person-user", email] });
      queryClient.invalidateQueries({ queryKey: ["person-lead", email] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setInvitePreviewOpen(false);
      if (invitePreviewMode === "invite_enroll") {
        // For invite+enroll, after invite succeeds, try to open enrollment
        // but user may not exist yet
        toast("You can enroll them once they accept the invite.", { duration: 5000 });
      }
    } catch (error) {
      if (error.response?.data?.userExists) {
        toast.success("This person already has an account.");
        queryClient.invalidateQueries({ queryKey: ["person-user", email] });
        setInvitePreviewOpen(false);
        if (invitePreviewMode === "invite_enroll") {
          setEnrollModalOpen(true);
        }
      } else {
        toast.error(error.response?.data?.error || error.message);
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
          <SheetHeader className="pb-0">
            <SheetTitle className="font-serif text-2xl text-[#1E3A32]">
              {nameIsMissing ? (
                <span className="italic text-[#2B2725]/40 text-lg">Name not set yet</span>
              ) : (
                displayName
              )}
            </SheetTitle>
            {displayUsername && (
              <p className="text-sm text-[#2B2725]/50 -mt-1">@{displayUsername}</p>
            )}
          </SheetHeader>

          <div className="mt-4 space-y-6">
            {/* Status + Summary Line */}
            <div>
              <PersonStatusBadge status={personStatus} />
              <PersonSummaryLine
                personStatus={personStatus}
                bookings={bookings}
                whatBought={whatBought}
                purchasedProducts={purchasedProducts}
              />
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Identity */}
            <div>
              <SectionLabel>Contact Information</SectionLabel>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={15} className="text-[#D8B46B] flex-shrink-0" />
                  <span className="text-[#2B2725]">{email}</span>
                </div>
                {phone ? (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={15} className="text-[#D8B46B] flex-shrink-0" />
                    <span className="text-[#2B2725]">{phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={15} className="text-[#2B2725]/20 flex-shrink-0" />
                    <span className="text-[#2B2725]/40 italic">No phone on file</span>
                  </div>
                )}
                {userData?.created_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-[#D8B46B] flex-shrink-0" />
                    <span className="text-[#2B2725]">
                      Member since {format(new Date(userData.created_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {(leadData?.source || leadData?.sources?.length > 0) && (
                  <div className="flex items-start gap-3 text-sm">
                    <ExternalLink size={15} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#2B2725]">
                        Source: <span className="font-medium">{leadData.source?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Unknown"}</span>
                      </span>
                      {leadData.sources?.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {leadData.sources.map((s, i) => (
                            <span key={i} className="inline-block text-[10px] px-1.5 py-0.5 bg-[#D8B46B]/10 text-[#2B2725]/70 rounded">
                              {s.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {leadData?.last_contact_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={15} className="text-[#D8B46B] flex-shrink-0" />
                    <span className="text-[#2B2725]">
                      Last contact: {format(new Date(leadData.last_contact_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Shipping Address */}
            <div>
              <SectionLabel>Shipping Address</SectionLabel>
              {hasAddress ? (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={15} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                  <div className="text-[#2B2725]">
                    {address.line1 ? (
                      <>
                        <p>{address.line1}</p>
                        {address.line2 && <p>{address.line2}</p>}
                        <p>
                          {[address.city, address.state, address.zip].filter(Boolean).join(", ")}
                        </p>
                        {address.country && address.country !== "US" && (
                          <p>{address.country}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
                        <p className="text-xs text-[#2B2725]/40 italic mt-0.5">City-level location only</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState text="No shipping address on file yet" />
              )}
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Bookings */}
            <div>
              <SectionLabel>Bookings</SectionLabel>
              <PersonBookingHistory bookings={bookings} />
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Purchases */}
            <div>
              <SectionLabel>Purchases</SectionLabel>
              {purchasedProducts.length > 0 ? (
                <div className="space-y-2">
                  {purchasedProducts.map((product) => (
                    <div key={product.id} className="flex items-start gap-3 text-sm">
                      <ShoppingBag size={15} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                      <p className="text-[#2B2725]">
                        {product.name}
                        {product.price > 0 && (
                          <span className="text-[#2B2725]/50"> — ${(product.price / 100).toFixed(2)}</span>
                        )}
                      </p>
                    </div>
                  ))}
                  {leadData?.date_of_purchase && (
                    <p className="text-xs text-[#2B2725]/40 ml-7">
                      Last purchase: {(() => {
                        try { return format(new Date(leadData.date_of_purchase), "MMM d, yyyy"); }
                        catch { return leadData.date_of_purchase; }
                      })()}
                    </p>
                  )}
                </div>
              ) : whatBought ? (
                <div className="space-y-2">
                  {whatBought.split(",").map((product, i) => {
                    const trimmed = product.trim();
                    if (!trimmed) return null;
                    return (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <ShoppingBag size={15} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                        <p className="text-[#2B2725]">
                          {trimmed}
                          {i === 0 && leadData?.date_of_purchase && (
                            <span className="text-[#2B2725]/50"> — Purchased {(() => {
                              try {
                                return format(new Date(leadData.date_of_purchase), "MMM d, yyyy");
                              } catch {
                                return leadData.date_of_purchase;
                              }
                            })()}</span>
                          )}
                          {leadData?.total_value > 0 && i === 0 && (
                            <span className="text-[#2B2725]/50"> — ${(leadData.total_value / 100).toFixed(0)}</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="No purchases yet" />
              )}
            </div>

            {/* Pending Access Grants — from migration */}
            {leadData?.pending_access_grants?.length > 0 && (
              <>
                <Separator className="bg-[#E4D9C4]" />
                <div>
                  <SectionLabel>Access Grants (Migration)</SectionLabel>
                  <PendingAccessGrantsSection grants={leadData.pending_access_grants} />
                </div>
              </>
            )}

            <Separator className="bg-[#E4D9C4]" />

            {/* Enrolled Programs */}
            <div>
              <SectionLabel>Enrolled Programs</SectionLabel>
              {!userData ? (
                <EmptyState text={personStatus === "invite_pending"
                  ? "Enrollment will be available after they accept the invite and set up their account."
                  : "Send an invite first so they can create an account."
                } />
              ) : enrollments.length === 0 ? (
                <EmptyState text="No enrollments yet" />
              ) : (
                <div className="space-y-2">
                  {enrollments.map((e) => {
                    const course = courses.find((c) => c.id === e.course_id);
                    const pct = e.completion_percentage || 0;
                    return (
                      <div
                        key={e.course_id}
                        className="p-2.5 bg-[#F9F5EF] rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <GraduationCap size={14} className="text-[#6E4F7D] flex-shrink-0" />
                            <span className="text-sm text-[#1E3A32] truncate">
                              {course?.title || "Unknown Course"}
                            </span>
                          </div>
                          <Badge className="bg-[#A6B7A3]/20 text-[#1E3A32] text-[10px]">
                            {e.status?.replace(/_/g, " ") || "enrolled"}
                          </Badge>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#E4D9C4]/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6E4F7D] rounded-full transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#2B2725]/50 w-8 text-right">{Math.round(pct)}%</span>
                        </div>
                        {/* Dates */}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#2B2725]/40">
                          {e.started_date && (
                            <span>Started {format(new Date(e.started_date), "MMM d, yyyy")}</span>
                          )}
                          {e.completed_date && (
                            <span>Completed {format(new Date(e.completed_date), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Account Status */}
            <div>
              <SectionLabel>Account Status</SectionLabel>
              {userData && userData.account_status === "inactive" ? (
                <div className="flex items-start gap-3 text-sm">
                  <UserX size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2B2725] font-medium">Account paused</p>
                    <p className="text-xs text-[#2B2725]/50 mt-0.5">
                      This user's access has been temporarily disabled.
                    </p>
                  </div>
                </div>
              ) : userData && userData.account_status === "archived" ? (
                <div className="flex items-start gap-3 text-sm">
                  <Archive size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2B2725] font-medium">Account archived</p>
                    <p className="text-xs text-[#2B2725]/50 mt-0.5">
                      This user's account has been archived.
                    </p>
                  </div>
                </div>
              ) : userData && userData.account_status === "deleted" ? (
                <div className="flex items-start gap-3 text-sm">
                  <Trash2 size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2B2725] font-medium">Account deleted</p>
                    <p className="text-xs text-[#2B2725]/50 mt-0.5">
                      This user's data has been anonymized and personal records purged.
                    </p>
                  </div>
                </div>
              ) : userData ? (
                <div className="flex items-start gap-3 text-sm">
                  <User size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2B2725] font-medium">Active account</p>
                    <p className="text-xs text-[#2B2725]/50 mt-0.5">
                      Joined {userData.created_date ? format(new Date(userData.created_date), "MMM d, yyyy") : "unknown"}
                    </p>
                  </div>
                </div>
              ) : personStatus === "invite_pending" ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-3 text-sm">
                    <Clock size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#2B2725] font-medium">Invite sent — waiting for setup</p>
                      {leadData?.invite_sent_at && (
                        <p className="text-xs text-[#2B2725]/50 mt-0.5">
                          Last sent: {format(new Date(leadData.invite_sent_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                      <p className="text-xs text-[#2B2725]/50 mt-0.5">
                        They haven't created their account yet. You can resend the invite if needed.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 ml-6"
                    onClick={handleInvite}
                    disabled={inviting}
                  >
                    {inviting ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <RefreshCw size={13} className="mr-1.5" />}
                    Resend Invite
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm">
                  <Mail size={15} className="text-[#2B2725]/25 flex-shrink-0 mt-0.5" />
                  <p className="text-[#2B2725]/40 italic">No invite sent yet</p>
                </div>
              )}
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Email History */}
            <div>
              <SectionLabel>Email History</SectionLabel>
              <EmailHistorySection email={email} />
            </div>

            <Separator className="bg-[#E4D9C4]" />

            {/* Actions */}
            <div>
              <SectionLabel>Actions</SectionLabel>
              <div className="flex flex-col gap-2">
                {/* Edit Details — for users or leads */}
                {userData && (
                  <Button
                    variant="outline"
                    className="justify-start border-[#E4D9C4]"
                    onClick={() => setEditUserDialogOpen(true)}
                  >
                    <Pencil size={15} className="mr-2 text-[#D8B46B]" />
                    Edit User Details
                  </Button>
                )}
                {leadData && (
                  <Button
                    variant="outline"
                    className="justify-start border-[#E4D9C4]"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Pencil size={15} className="mr-2 text-[#D8B46B]" />
                    Edit Lead Details
                  </Button>
                )}

                {/* Email */}
                <Button
                  variant="outline"
                  className="justify-start border-[#E4D9C4]"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Send size={15} className="mr-2 text-[#6E4F7D]" />
                  Send Email
                </Button>

                {/* Invite — only for leads who haven't been invited yet */}
                {!userData && personStatus === "lead" && (
                  <Button
                    variant="outline"
                    className="justify-start border-[#E4D9C4]"
                    onClick={handleInvite}
                    disabled={inviting}
                  >
                    {inviting ? (
                      <Loader2 size={15} className="mr-2 animate-spin" />
                    ) : (
                      <Mail size={15} className="mr-2 text-[#D8B46B]" />
                    )}
                    {inviting ? "Sending Invite..." : "Invite to Platform"}
                  </Button>
                )}

                {/* Enroll — smart behavior */}
                {userData ? (
                  <Button
                    className="justify-start bg-[#6E4F7D] hover:bg-[#5A3F69] text-white"
                    onClick={() => setEnrollModalOpen(true)}
                  >
                    <GraduationCap size={15} className="mr-2" />
                    Enroll in Course
                  </Button>
                ) : (
                  <Button
                    className="justify-start bg-[#6E4F7D]/80 hover:bg-[#6E4F7D] text-white"
                    onClick={() => {
                      setInvitePreviewMode("invite_enroll");
                      setInvitePreviewOpen(true);
                    }}
                    disabled={inviting}
                  >
                    <GraduationCap size={15} className="mr-2" />
                    Invite + Enroll
                  </Button>
                )}
                {!userData && (
                  <p className="text-xs text-[#2B2725]/40 italic ml-1">
                    {personStatus === "invite_pending"
                      ? "Enrollment will be available after they accept the invite and create their account."
                      : "Send an invite first — enrollment will be available after they create their account."}
                  </p>
                )}

                {/* Opt Out / Archive — for active leads */}
                {leadData && (!leadData.lead_status || leadData.lead_status === "active") && (
                  <>
                    <Button
                      variant="outline"
                      className="justify-start border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => setOptOutDialogOpen(true)}
                    >
                      <UserX size={15} className="mr-2" />
                      Opt Out / Archive
                    </Button>
                  </>
                )}
                {leadData && leadData.lead_status === "archived" && (
                  <>
                    {leadData.tags?.includes("opted_out") && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        <UserX size={14} />
                        <span>Opted out{leadData.opted_out_at ? ` on ${format(new Date(leadData.opted_out_at), "MMM d, yyyy")}` : ""}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="justify-start border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => setArchiveLeadAction("restore")}
                    >
                      <CheckCircle size={15} className="mr-2" />
                      Restore Lead
                    </Button>
                  </>
                )}

                {/* Account status actions — only for users, not self, not admin/manager */}
                {userData && currentUserEmail && userData.email?.toLowerCase() !== currentUserEmail?.toLowerCase() && 
                 (userData.custom_role || userData.role) !== "admin" && (userData.custom_role || userData.role) !== "manager" && (
                  <>
                    {(!userData.account_status || userData.account_status === "active") && (
                      <>
                        <Button variant="outline" className="justify-start border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setStatusAction("deactivate")}>
                          <UserX size={15} className="mr-2" /> Deactivate Account
                        </Button>
                        <Button variant="outline" className="justify-start border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => setStatusAction("archive")}>
                          <Archive size={15} className="mr-2" /> Archive Account
                        </Button>
                      </>
                    )}
                    {(userData.account_status === "inactive" || userData.account_status === "archived") && (
                      <Button variant="outline" className="justify-start border-green-200 text-green-700 hover:bg-green-50" onClick={() => setStatusAction("reactivate")}>
                        <CheckCircle size={15} className="mr-2" /> Reactivate Account
                      </Button>
                    )}
                    {(userData.account_status === "inactive" || userData.account_status === "archived") && (
                      <Button variant="outline" className="justify-start border-red-200 text-red-600 hover:bg-red-50" onClick={() => setSafeDeleteOpen(true)}>
                        <Trash2 size={15} className="mr-2" /> Permanent Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Suggested Next Step */}
            <SuggestedNextStep
              personStatus={personStatus}
              userData={userData}
              bookings={bookings}
              whatBought={whatBought}
              enrollments={enrollments}
            />

            {/* Notes — user manager notes + lead notes */}
            {(userData?.manager_notes || leadData?.notes) && (
              <>
                <Separator className="bg-[#E4D9C4]" />
                <div>
                  <SectionLabel>Notes</SectionLabel>
                  {userData?.manager_notes && (
                    <p className="text-sm text-[#2B2725] whitespace-pre-line">
                      {userData.manager_notes}
                    </p>
                  )}
                  {leadData?.notes && userData?.manager_notes && leadData.notes !== userData.manager_notes && (
                    <div className="mt-2 pt-2 border-t border-[#E4D9C4]/50">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[#2B2725]/40 mb-1">From Lead Record</p>
                      <p className="text-sm text-[#2B2725]/70 whitespace-pre-line">
                        {leadData.notes}
                      </p>
                    </div>
                  )}
                  {leadData?.notes && !userData?.manager_notes && (
                    <p className="text-sm text-[#2B2725] whitespace-pre-line">
                      {leadData.notes}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Enrollment modal — pre-filled with email */}
      <ManualEnrollmentModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["person-enrollments", userData?.id] });
          setEnrollModalOpen(false);
        }}
      />

      {/* Email dialog */}
      {emailDialogOpen && (
        <SendIndividualEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          recipientEmail={email}
          recipientName={displayName}
        />
      )}

      {/* Edit user details dialog */}
      {editUserDialogOpen && userData && (
        <EditUserDialog
          open={editUserDialogOpen}
          onOpenChange={setEditUserDialogOpen}
          user={userData}
        />
      )}

      {/* Edit lead details dialog */}
      {editDialogOpen && leadData && (
        <LeadDetailsDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          lead={leadData}
        />
      )}

      {/* Branded invite email preview */}
      <InviteEmailPreview
        open={invitePreviewOpen}
        onOpenChange={setInvitePreviewOpen}
        recipientName={displayName}
        recipientEmail={email}
        mode={invitePreviewMode === "invite_enroll" ? "invite_enroll" : personStatus === "invite_pending" ? "resend" : "invite"}
        onConfirmSend={handleConfirmInvite}
      />

      {/* Deactivate/Archive/Reactivate Dialog */}
      {statusAction && userData && (
        <DeactivateUserDialog
          open={!!statusAction}
          onOpenChange={(v) => { if (!v) setStatusAction(null); }}
          user={userData}
          action={statusAction}
        />
      )}

      {/* Safe Delete Dialog */}
      {safeDeleteOpen && userData && (
        <SafeDeleteUserDialog
          open={safeDeleteOpen}
          onOpenChange={setSafeDeleteOpen}
          user={userData}
        />
      )}

      {/* Archive/Restore Lead Dialog */}
      {archiveLeadAction && leadData && (
        <ArchiveLeadDialog
          open={!!archiveLeadAction}
          onOpenChange={(v) => { if (!v) setArchiveLeadAction(null); }}
          lead={leadData}
          action={archiveLeadAction}
        />
      )}

      {/* Opt Out Dialog */}
      {optOutDialogOpen && leadData && (
        <OptOutLeadDialog
          open={optOutDialogOpen}
          onOpenChange={setOptOutDialogOpen}
          lead={leadData}
        />
      )}
    </>
  );
}