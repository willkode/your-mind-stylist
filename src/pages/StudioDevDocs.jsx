import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Copy, Archive } from "lucide-react";
import { format } from "date-fns";

export default function StudioDevDocs() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["devDocs"],
    queryFn: () => base44.entities.DevDoc.list("-updated_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DevDoc.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devDocs"] });
    },
  });

  const filteredDocs = categoryFilter === "all" 
    ? docs 
    : docs.filter(doc => doc.category === categoryFilter);

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Dev Docs & Specs</h1>
            <p className="text-[#2B2725]/70">
              Central place for feature specs, flows, and internal documentation
            </p>
          </div>
          <Link to={createPageUrl("StudioDevDocEditor?mode=new")}>
            <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
              <Plus size={20} className="mr-2" />
              New Doc
            </Button>
          </Link>
        </div>

        {/* Filter */}
        <div className="bg-white p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#2B2725]/70">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Feature">Feature</SelectItem>
                <SelectItem value="Flow">Flow</SelectItem>
                <SelectItem value="Integration">Integration</SelectItem>
                <SelectItem value="Content Spec">Content Spec</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Docs Table */}
        <div className="bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[#2B2725]/60">Loading docs...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-[#2B2725]/60">
              No docs found. Create your first one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F5EF]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#2B2725]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#F9F5EF]/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1E3A32]">{doc.title}</p>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {doc.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-[#D8B46B]/20 text-[#2B2725]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#2B2725]/70">{doc.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        {doc.owner || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        {format(new Date(doc.updated_date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={createPageUrl(`StudioDevDocEditor?mode=edit&id=${doc.id}`)}>
                            <Button variant="ghost" size="icon">
                              <Edit size={18} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleDelete(doc.id, doc.title)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}