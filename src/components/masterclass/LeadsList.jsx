import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Play, CheckCircle, Mail, Calendar } from "lucide-react";

export default function LeadsList({ signups }) {
  if (signups.length === 0) {
    return (
      <div className="text-center py-12 text-[#2B2725]/50">
        No leads match your filters
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E4D9C4]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#2B2725]/70">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#2B2725]/70">Email</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#2B2725]/70">Signed Up</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-[#2B2725]/70">Status</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-[#2B2725]/70">Emails</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#2B2725]/70">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {signups.map((signup) => (
            <tr key={signup.id} className="border-b border-[#E4D9C4] hover:bg-[#F9F5EF] transition-colors">
              <td className="py-3 px-4">
                <div className="font-medium text-[#1E3A32]">{signup.full_name}</div>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm text-[#2B2725]/70">{signup.email}</div>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm text-[#2B2725]/70">
                  {format(new Date(signup.signup_date || signup.created_date), "MMM d, yyyy")}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center gap-2">
                  {signup.watched ? (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <Play size={12} />
                      Watched
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Not Watched</Badge>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center gap-1">
                  {signup.confirmation_sent && (
                    <span className="w-2 h-2 bg-[#6E4F7D] rounded-full" title="Confirmation sent" />
                  )}
                  {signup.reminder_sent && (
                    <span className="w-2 h-2 bg-[#2D8CFF] rounded-full" title="Reminder sent" />
                  )}
                  {signup.post_email_1_sent && (
                    <span className="w-2 h-2 bg-[#A6B7A3] rounded-full" title="Follow-up 1 sent" />
                  )}
                  {signup.post_email_2_sent && (
                    <span className="w-2 h-2 bg-[#D8B46B] rounded-full" title="Follow-up 2 sent" />
                  )}
                  {signup.post_email_3_sent && (
                    <span className="w-2 h-2 bg-[#1E3A32] rounded-full" title="Follow-up 3 sent" />
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                {signup.converted_to ? (
                  <Badge className="bg-[#A6B7A3] text-white flex items-center gap-1 w-fit">
                    <CheckCircle size={12} />
                    {signup.converted_to}
                  </Badge>
                ) : (
                  <span className="text-sm text-[#2B2725]/40">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}