import React, { useState } from "react";
// Force rebuild v2
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CreditCard, 
  FileText, 
  BookOpen, 
  Video,
  Lock,
  CheckCircle,
  DollarSign,
  ExternalLink,
  Layers,
  Headphones,
  Award,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import StudentDashboard from "../components/library/StudentDashboard";
import AudiobookLibrarySection from "../components/audiobook/AudiobookLibrarySection";
import PurchasedProductsSection from "../components/library/PurchasedProductsSection";

export default function ClientPortal() {
  if (typeof window !== 'undefined') {
    window.__USE_AUTH_LAYOUT = true;
  }

  const [expandedSections, setExpandedSections] = useState({ products: true, toolkit: true, webinars: true, audio: true, training: true, audiobooks: true });
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["myBookings", user?.email],
    queryFn: () => base44.entities.Booking.filter({ user_email: user.email }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ["userCourseProgress", user?.id],
    queryFn: () => base44.entities.UserCourseProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: userLessonProgress = [] } = useQuery({
    queryKey: ["userLessonProgress", user?.id],
    queryFn: () => base44.entities.UserLessonProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["enrolledCourses", user?.id],
    queryFn: async () => {
      const courseIds = userProgress.map(p => p.course_id);
      if (courseIds.length === 0) return [];
      const enrolled = await Promise.all(courseIds.map(id => base44.entities.Course.get(id)));
      return enrolled.filter(c => c && c.status === "published");
    },
    enabled: !!user?.id && userProgress.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allModules = [] } = useQuery({
    queryKey: ["enrolledModules", courses.map(c => c.id).join(",")],
    queryFn: async () => {
      if (courses.length === 0) return [];
      const results = await Promise.all(courses.map(c => base44.entities.Module.filter({ course_id: c.id })));
      return results.flat();
    },
    enabled: courses.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ["enrolledLessons", allModules.map(m => m.id).join(",")],
    queryFn: async () => {
      if (allModules.length === 0) return [];
      const results = await Promise.all(allModules.map(m => base44.entities.Lesson.filter({ module_id: m.id })));
      return results.flat();
    },
    enabled: allModules.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const { data: upcomingBookings = [] } = useQuery({
    queryKey: ["upcomingBookings", user?.id],
    queryFn: async () => {
      const all = await base44.entities.Booking.filter({ user_email: user.email, booking_status: "confirmed" });
      return all.filter(b => new Date(b.scheduled_date) > new Date()).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    },
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["publishedResources"],
    queryFn: () => base44.entities.Resource.filter({ status: "published" }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch purchased products from user record
  const { data: purchasedProducts = [] } = useQuery({
    queryKey: ["purchasedProducts", user?.id],
    queryFn: async () => {
      const ids = user?.purchased_product_ids || [];
      if (ids.length === 0) return [];
      const allProducts = await base44.entities.Product.filter({ status: "published" });
      return allProducts.filter(p => ids.includes(p.id));
    },
    enabled: !!user?.purchased_product_ids?.length,
    staleTime: 5 * 60 * 1000,
  });

  const completedBookings = bookings.filter(b =>
    b.booking_status === 'completed' && b.session_notes
  );

  const paidBookings = bookings.filter(b =>
    b.payment_status === 'paid'
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const formatAmount = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);

  const totalSpent = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const getCourseProgress = (courseId) => userProgress.find(p => p.course_id === courseId)?.completion_percentage || 0;
  const getCourseStatus = (courseId) => {
    const p = userProgress.find(pr => pr.course_id === courseId);
    if (!p || p.status === "not_started") return "Not Started";
    if (p.status === "completed") return "Completed";
    return "In Progress";
  };

  const coursesByType = {
    toolkit: courses.filter(c => c.type === "Toolkit Module"),
    webinar: courses.filter(c => c.type === "Webinar"),
    audio: courses.filter(c => c.type === "Audio-Based Program"),
    training: courses.filter(c => c.type === "Training Program"),
  };

  const CourseSection = ({ title, icon: Icon, sectionKey, items, color }) => {
    if (items.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];
    return (
      <div className="mb-8">
        <button onClick={() => toggleSection(sectionKey)} className="w-full flex items-center justify-between mb-4 group">
          <div className="flex items-center gap-2">
            <Icon size={20} style={{ color }} />
            <h2 className="font-serif text-xl text-[#1E3A32]">{title}</h2>
          </div>
          {isExpanded ? <ChevronUp className="text-[#D8B46B]" /> : <ChevronDown className="text-[#D8B46B]" />}
        </button>
        {isExpanded && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((course) => {
              const progress = getCourseProgress(course.id);
              const status = getCourseStatus(course.id);
              return (
                <Card key={course.id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={28} style={{ color }} />
                    <Badge className={status === "Completed" ? "bg-green-100 text-green-800" : status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}>
                      {status}
                    </Badge>
                  </div>
                  <h3 className="font-serif text-lg text-[#1E3A32] mb-1">{course.title}</h3>
                  <p className="text-xs text-[#2B2725]/60 mb-3 line-clamp-2">{course.short_description}</p>
                  {progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-[#2B2725]/60 mb-1">
                        <span>Progress</span><span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[#D8B46B]" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <Link to={createPageUrl(`CoursePage?slug=${course.slug}`)}>
                    <Button className="w-full text-sm" style={{ backgroundColor: color }}>
                      {status === "Not Started" ? "Start" : status === "Completed" ? "Revisit" : "Continue"}
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Client Portal</h1>
          <p className="text-[#2B2725]/70">Your complete account overview</p>
        </motion.div>

        {(user?.role === "manager" || user?.role === "admin") && (
          <div className="mb-6 px-4 py-3 bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D8B46B] flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p className="text-sm text-[#2B2725]/70">You're viewing as manager. Clients only see courses and products they have purchased or been enrolled in.</p>
          </div>
        )}

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="materials">
              <BookOpen size={16} className="mr-2" />
              My Library
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <FileText size={16} className="mr-2" />
              Session Notes
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard size={16} className="mr-2" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar size={16} className="mr-2" />
              My Bookings
            </TabsTrigger>
          </TabsList>

          {/* Materials / Library Tab */}
          <TabsContent value="materials">
            <div>
              {/* Audiobooks — always rendered (component handles its own empty state) */}
              <AudiobookLibrarySection
                userId={user?.id}
                expanded={expandedSections.audiobooks}
                onToggle={() => toggleSection("audiobooks")}
              />

              {/* Purchased Products Section */}
              <PurchasedProductsSection
                products={purchasedProducts}
                resources={resources}
                expanded={expandedSections.products}
                onToggle={() => toggleSection("products")}
              />

              {courses.length === 0 && purchasedProducts.length === 0 ? (
                <Card className="p-12 text-center">
                  <Lock size={48} className="mx-auto mb-4 text-[#2B2725]/30" />
                  <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">Your Library is Empty (For Now)</h3>
                  <p className="text-[#2B2725]/70 mb-6">You can start anytime. Pocket Visualization™ is a gentle place to begin, or explore all programs to see what resonates.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={createPageUrl("Programs")}>
                      <Button className="bg-[#1E3A32] hover:bg-[#2B2725]">Explore Programs</Button>
                    </Link>
                    <Link to={createPageUrl("PocketMindset")}>
                      <Button variant="outline">Explore Pocket Mindset™</Button>
                    </Link>
                  </div>
                </Card>
              ) : courses.length === 0 ? (
                null /* Products are shown above, skip course sections if none enrolled */
              ) : (
                <div>
                  {/* Student Dashboard Summary */}
                  {userProgress.length > 0 && (
                    <div className="mb-8">
                      <StudentDashboard
                        courses={courses}
                        userProgress={userProgress}
                        userLessonProgress={userLessonProgress}
                        allLessons={allLessons}
                        modules={allModules}
                        upcomingBookings={upcomingBookings}
                      />
                    </div>
                  )}

                  {/* Courses by Type */}
                  <CourseSection title="Mind Style Toolkit" icon={Layers} sectionKey="toolkit" items={coursesByType.toolkit} color="#1E3A32" />
                  <CourseSection title="Webinars" icon={Video} sectionKey="webinars" items={coursesByType.webinar} color="#6E4F7D" />
                  <CourseSection title="Audio Programs" icon={Headphones} sectionKey="audio" items={coursesByType.audio} color="#D8B46B" />
                  <CourseSection title="Training & Certification" icon={Award} sectionKey="training" items={coursesByType.training} color="#1E3A32" />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Session Notes Tab */}
          <TabsContent value="sessions">
            {completedBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText size={48} className="mx-auto mb-4 text-[#2B2725]/30" />
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">
                  No Session Notes Yet
                </h3>
                <p className="text-[#2B2725]/70">
                  After each session, your notes will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedBookings.map((booking) => (
                  <Card key={booking.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-xl text-[#1E3A32] mb-1">
                          {booking.service_type?.replace(/_/g, " ")}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-[#2B2725]/70">
                          <Calendar size={14} />
                          <span>
                            {format(new Date(booking.scheduled_date), "MMMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    </div>
                    
                    <div className="bg-[#F9F5EF] p-4 border-l-4 border-[#D8B46B]">
                      <p className="text-sm font-medium text-[#1E3A32] mb-2">
                        Session Notes
                      </p>
                      <p className="text-[#2B2725] whitespace-pre-wrap">
                        {booking.session_notes}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments">
            <div className="mb-6">
              <Card className="p-6 bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Total Invested</p>
                    <p className="text-3xl font-serif">{formatAmount(totalSpent)}</p>
                  </div>
                  <DollarSign size={40} className="text-white/30" />
                </div>
              </Card>
            </div>

            {paidBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-[#2B2725]/30" />
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">
                  No Payment History
                </h3>
                <p className="text-[#2B2725]/70">
                  Your payment records will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {paidBookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1E3A32]">
                            {booking.service_type?.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-[#2B2725]/70">
                            {format(new Date(booking.created_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-xl text-[#1E3A32]">
                          {formatAmount(booking.amount)}
                        </p>
                        <Badge className="bg-green-100 text-green-800">
                          Paid
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-[#1E3A32]">
                  All Bookings
                </h3>
                <Link to={createPageUrl("ClientBookings")}>
                  <Button variant="outline">
                    <ExternalLink size={16} className="mr-2" />
                    Manage Bookings
                  </Button>
                </Link>
              </div>
              <p className="text-[#2B2725]/70">
                View and manage all your bookings in the dedicated bookings page
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}