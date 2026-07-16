import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Search, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ManualEnrollmentModal({ open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(""); // kept for backward compat
  const [sendNotification, setSendNotification] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [existingEnrollments, setExistingEnrollments] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [successResult, setSuccessResult] = useState(null); // { message, emailSent, courseName }
  const debounceRef = useRef(null);

  // Fetch all users for name search
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersForEnrollment"],
    queryFn: () => base44.entities.User.list(),
    enabled: open,
  });

  const handleNameSearch = (value) => {
    setNameSearch(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setNameSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      const q = value.toLowerCase();
      const matches = allUsers.filter(u =>
        u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      ).slice(0, 6);
      setNameSuggestions(matches);
    }, 200);
  };

  const selectUserFromSearch = (u) => {
    setNameSearch("");
    setNameSuggestions([]);
    setUserEmail(u.email);
    checkUserExists(u.email);
  };

  // Fetch all active courses
  const { data: courses = [] } = useQuery({
    queryKey: ["coursesForEnrollment"],
    queryFn: () => base44.entities.Course.filter({ status: "published" }),
    enabled: open,
  });

  // Check if user exists via backend + fetch enrollments
  const checkUserExists = async (email) => {
    if (!email.trim()) {
      setUserExists(false);
      setExistingEnrollments([]);
      return;
    }
    setCheckingUser(true);
    try {
      const [checkRes, enrollRes] = await Promise.all([
        base44.functions.invoke("inviteUserToApp", { email: email.toLowerCase(), checkOnly: true }),
        base44.functions.invoke("getUserEnrollments", { email: email.toLowerCase() }),
      ]);
      setUserExists(checkRes.data?.userExists || false);
      setExistingEnrollments(enrollRes.data?.enrollments || []);
    } catch (error) {
      if (error.response?.data?.userExists) {
        setUserExists(true);
      } else {
        setUserExists(false);
      }
      setExistingEnrollments([]);
    } finally {
      setCheckingUser(false);
    }
  };

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke("inviteUserToApp", {
        email: userEmail.toLowerCase(),
        role: 'user',
      }),
    onSuccess: (response) => {
      toast.success(`Invitation sent to ${userEmail}`);
      if (response.data?.emailSent) {
        toast.success("Invitation email delivered!");
      }
      setUserExists(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message);
    },
  });

  // Enrollment mutation — supports multiple courses
  const enrollmentMutation = useMutation({
    mutationFn: async () => {
      const courseIds = selectedCourses.length > 0 ? selectedCourses : (selectedCourse ? [selectedCourse] : []);
      const results = [];
      // Only send notification on the last enrollment to avoid spam
      for (let i = 0; i < courseIds.length; i++) {
        const isLast = i === courseIds.length - 1;
        const res = await base44.functions.invoke("manualEnrollUser", {
          user_email: userEmail.toLowerCase(),
          course_id: courseIds[i],
          send_notification: sendNotification && isLast,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        });
        results.push(res.data);
      }
      return results;
    },
    onSuccess: (results) => {
      const courseIds = selectedCourses.length > 0 ? selectedCourses : (selectedCourse ? [selectedCourse] : []);
      const courseNames = courseIds.map(id => courses.find(c => c.id === id)?.title || "Unknown").join(", ");
      setSuccessResult({
        message: `Successfully enrolled in ${courseIds.length} course${courseIds.length > 1 ? "s" : ""}!`,
        emailSent: results[results.length - 1]?.emailSent,
        courseName: courseNames,
        userEmail,
        notificationRequested: sendNotification,
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Enrollment error:", error);
      const errorMsg = error.response?.data?.error || error.message || "Enrollment failed";
      toast.error(errorMsg);
    },
  });

  const toggleCourse = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleReset = () => {
    setUserEmail("");
    setFirstName("");
    setLastName("");
    setSelectedCourse("");
    setSelectedCourses([]);
    setSendNotification(true);
    setUserExists(false);
    setExistingEnrollments([]);
    setSuccessResult(null);
    setNameSearch("");
    setNameSuggestions([]);
  };

  const handleEnroll = () => {
    const hasCourses = selectedCourses.length > 0 || selectedCourse;
    if (!userEmail.trim() || !hasCourses) {
      toast.error("Please fill in all required fields");
      return;
    }
    enrollmentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manually Enroll User</DialogTitle>
        </DialogHeader>

        {successResult ? (
          <div className="py-4 space-y-4">
            <div className="flex flex-col items-center text-center gap-3 p-6 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle size={40} className="text-green-500" />
              <div>
                <p className="font-semibold text-green-800 text-lg">Enrollment Successful!</p>
                <p className="text-sm text-green-700 mt-1">{successResult.message}</p>
              </div>
              <div className="w-full mt-2 p-3 bg-white rounded-lg border border-green-100 text-sm text-left space-y-1">
                <p><span className="text-gray-500">Course:</span> <span className="font-medium">{successResult.courseName}</span></p>
                <p><span className="text-gray-500">User:</span> <span className="font-medium">{successResult.userEmail}</span></p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Notification email:</span>
                  {successResult.notificationRequested ? (
                    successResult.emailSent ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle size={14} /> Sent successfully
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertCircle size={14} /> Could not be sent
                      </span>
                    )
                  ) : (
                    <span className="text-gray-400">Not requested</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>Enroll Another</Button>
              <Button onClick={() => { handleReset(); onOpenChange(false); }} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">Done</Button>
            </div>
          </div>
        ) : (

        <div className="space-y-4">
          {/* Name search */}
          <div className="relative">
            <Label className="text-sm font-medium">Search by Name</Label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Type a name to find user..."
                value={nameSearch}
                onChange={(e) => handleNameSearch(e.target.value)}
                className="pl-8"
                disabled={enrollmentMutation.isPending}
              />
            </div>
            {nameSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {nameSuggestions.map(u => (
                  <li
                    key={u.id}
                    onClick={() => selectUserFromSearch(u)}
                    className="px-3 py-2 hover:bg-[#F9F5EF] cursor-pointer text-sm flex justify-between items-center"
                  >
                    <span className="font-medium">{u.full_name || "(no name)"}</span>
                    <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            <span>or enter email directly</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              User Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => {
                setUserEmail(e.target.value);
                checkUserExists(e.target.value);
              }}
              disabled={enrollmentMutation.isPending || inviteMutation.isPending}
            />
            {userEmail && !userExists && !checkingUser && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Mail size={16} className="text-amber-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-800 font-medium">This person hasn't set up their account yet</p>
                  <p className="text-xs text-amber-700">Send them an invite so they can create their account</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending}
                  className="flex-shrink-0 text-xs"
                >
                  {inviteMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    'Send Invite'
                  )}
                </Button>
              </div>
            )}
            {userExists && (
              <div className="mt-1">
                <p className="text-xs text-green-600">✓ Active client — ready to enroll</p>
                {existingEnrollments.length > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <p className="font-medium mb-1">Already enrolled in:</p>
                    <ul className="space-y-0.5">
                      {existingEnrollments.map(e => {
                        const course = courses.find(c => c.id === e.course_id);
                        return course ? <li key={e.course_id}>• {course.title}</li> : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={enrollmentMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={enrollmentMutation.isPending}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Select Courses * <span className="text-xs font-normal text-[#2B2725]/50">(select one or more)</span>
            </Label>
            <div className="mt-2 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {courses.length === 0 ? (
                <p className="text-xs text-[#2B2725]/50 p-3">No published courses available</p>
              ) : (
                courses.map((course) => {
                  const alreadyEnrolled = existingEnrollments.some(e => e.course_id === course.id);
                  const isSelected = selectedCourses.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F9F5EF]/50 transition-colors ${alreadyEnrolled ? "opacity-50 cursor-not-allowed" : ""} ${isSelected ? "bg-[#6E4F7D]/5" : ""}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => !alreadyEnrolled && toggleCourse(course.id)}
                        disabled={alreadyEnrolled || enrollmentMutation.isPending}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#1E3A32] block truncate">{course.title}</span>
                        {course.type && <span className="text-[10px] text-[#2B2725]/50">{course.type}</span>}
                      </div>
                      {alreadyEnrolled && (
                        <span className="text-[10px] text-amber-600 flex-shrink-0">enrolled</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            {selectedCourses.length > 0 && (
              <p className="text-xs text-[#6E4F7D] mt-1 font-medium">{selectedCourses.length} course{selectedCourses.length > 1 ? "s" : ""} selected</p>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#F9F5EF] rounded-lg">
            <Checkbox
              id="notify"
              checked={sendNotification}
              onCheckedChange={setSendNotification}
              disabled={enrollmentMutation.isPending}
            />
            <Label
              htmlFor="notify"
              className="text-sm cursor-pointer flex-1 mb-0"
            >
              Send enrollment notification email
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E4D9C4]">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={enrollmentMutation.isPending || inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={
                !userEmail.trim() ||
                (selectedCourses.length === 0 && !selectedCourse) ||
                !userExists ||
                enrollmentMutation.isPending ||
                inviteMutation.isPending
              }
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              {enrollmentMutation.isPending && (
                <Loader2 size={14} className="mr-2 animate-spin" />
              )}
              {enrollmentMutation.isPending ? "Enrolling..." : "Enroll User"}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>


    </Dialog>
  );
}