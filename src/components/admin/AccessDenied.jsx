import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";

export default function AccessDenied({ userRole = "user" }) {
  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-10 text-center shadow-sm border border-[#E4D9C4]">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} className="text-red-500" />
        </div>
        <h1 className="font-serif text-2xl text-[#1E3A32] mb-3">Access Denied</h1>
        <p className="text-[#2B2725]/70 text-sm leading-relaxed mb-2">
          You don't have permission to view this page.
        </p>
        <p className="text-[#2B2725]/50 text-xs mb-8">
          Your current access level: {ROLE_LABELS[userRole] || "User"}
        </p>
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}