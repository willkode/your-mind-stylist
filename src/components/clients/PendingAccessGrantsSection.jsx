import React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
  provisioned: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Provisioned" },
  failed: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", label: "Failed" },
  skipped: { icon: ShieldAlert, color: "text-gray-500", bg: "bg-gray-50", label: "Skipped" },
};

export default function PendingAccessGrantsSection({ grants }) {
  if (!grants || grants.length === 0) return null;

  const pending = grants.filter(g => g.status === "pending");
  const provisioned = grants.filter(g => g.status === "provisioned");
  const failed = grants.filter(g => g.status === "failed");
  const skipped = grants.filter(g => g.status === "skipped");

  return (
    <div className="space-y-3">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-1.5">
        {pending.length > 0 && (
          <Badge className="bg-amber-100 text-amber-700 text-[10px]">
            {pending.length} pending
          </Badge>
        )}
        {provisioned.length > 0 && (
          <Badge className="bg-green-100 text-green-700 text-[10px]">
            {provisioned.length} provisioned
          </Badge>
        )}
        {failed.length > 0 && (
          <Badge className="bg-red-100 text-red-600 text-[10px]">
            {failed.length} failed
          </Badge>
        )}
        {skipped.length > 0 && (
          <Badge className="bg-gray-100 text-gray-600 text-[10px]">
            {skipped.length} skipped
          </Badge>
        )}
      </div>

      {/* Grant list */}
      <div className="space-y-1.5">
        {grants.map((grant, i) => {
          const config = STATUS_CONFIG[grant.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          return (
            <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg ${config.bg}`}>
              <Icon size={14} className={`${config.color} flex-shrink-0 mt-0.5`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#2B2725] font-medium truncate">
                    {grant.platform_item_name || "Unknown item"}
                  </span>
                  {grant.protected && (
                    <Badge className="bg-[#6E4F7D]/10 text-[#6E4F7D] text-[9px]">Protected</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-[10px] text-[#2B2725]/50">
                    {grant.action_type?.replace(/_/g, " ")}
                  </span>
                  {grant.confidence && (
                    <span className="text-[10px] text-[#2B2725]/40">
                      confidence: {grant.confidence}
                    </span>
                  )}
                  {grant.provisioned_at && (
                    <span className="text-[10px] text-green-600">
                      provisioned {format(new Date(grant.provisioned_at), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
                {grant.csv_purchase_text && grant.csv_purchase_text !== grant.platform_item_name && (
                  <p className="text-[10px] text-[#2B2725]/35 italic mt-0.5">
                    CSV: "{grant.csv_purchase_text}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}