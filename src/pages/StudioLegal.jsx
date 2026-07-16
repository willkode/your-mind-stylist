import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Edit, FileText, Scale } from "lucide-react";
import { format } from "date-fns";

export default function StudioLegal() {
  const { data: legalPages = [], isLoading } = useQuery({
    queryKey: ["legalPages"],
    queryFn: () => base44.entities.LegalPage.list(),
  });

  const defaultPages = [
    { title: "Privacy Policy", slug: "privacy-policy" },
    { title: "Terms of Service", slug: "terms-of-service" },
    { title: "Cookie Policy", slug: "cookie-policy" },
    { title: "Disclaimer", slug: "disclaimer" },
  ];

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Scale size={32} className="text-[#1E3A32]" />
            <h1 className="font-serif text-4xl text-[#1E3A32]">Legal Pages</h1>
          </div>
          <p className="text-[#2B2725]/70">
            Edit the text content for your legal pages. These pages must stay accurate—consult your legal partner before making large changes.
          </p>
        </div>

        {/* Legal Pages List */}
        <div className="space-y-4">
          {defaultPages.map((page) => {
            const existingPage = legalPages.find(p => p.slug === page.slug);
            
            return (
              <div key={page.slug} className="bg-white p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <FileText size={24} className="text-[#D8B46B]" />
                  <div>
                    <h3 className="font-medium text-[#1E3A32] mb-1">{page.title}</h3>
                    {existingPage?.last_reviewed && (
                      <p className="text-sm text-[#2B2725]/60">
                        Last reviewed: {format(new Date(existingPage.last_reviewed), "MMM d, yyyy")}
                      </p>
                    )}
                    {!existingPage && (
                      <p className="text-sm text-[#2B2725]/60">Not yet created</p>
                    )}
                  </div>
                </div>
                <Link to={createPageUrl(`StudioLegalEditor?slug=${page.slug}`)}>
                  <Button variant="outline">
                    <Edit size={18} className="mr-2" />
                    {existingPage ? "Edit" : "Create"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Warning Box */}
        <div className="mt-8 bg-[#6E4F7D]/10 border-l-4 border-[#6E4F7D] p-6">
          <p className="text-sm text-[#2B2725]/80 leading-relaxed">
            <strong>Important:</strong> These legal documents protect both you and your users. If you need legal review or aren't sure about wording, consult your legal partner before publishing changes.
          </p>
        </div>
      </div>
    </div>
  );
}