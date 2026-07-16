import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AdminRoadmap() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Feature",
    priority: "Medium",
    status: "Planned",
    source: "Roadmap",
    assigned_to: "",
    due_date: "",
    notes: "",
  });

  const { data: roadmapItems = [], isLoading } = useQuery({
    queryKey: ["roadmapItems"],
    queryFn: () => base44.entities.RoadmapItem.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Auto-create bug item if coming from bug tracker
      const item = await base44.entities.RoadmapItem.create(data);
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapItems"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RoadmapItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapItems"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RoadmapItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmapItems"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Feature",
      priority: "Medium",
      status: "Planned",
      assigned_to: "",
      due_date: "",
      notes: "",
    });
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const filteredItems = roadmapItems.filter(item => {
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchSource = sourceFilter === "all" || item.source === sourceFilter || (!item.source && sourceFilter === "Roadmap");
    return matchStatus && matchSource;
  });

  const groupedByStatus = {
    "Planned": filteredItems.filter(i => i.status === "Planned"),
    "In Progress": filteredItems.filter(i => i.status === "In Progress"),
    "Testing": filteredItems.filter(i => i.status === "Testing"),
    "Completed": filteredItems.filter(i => i.status === "Completed"),
    "On Hold": filteredItems.filter(i => i.status === "On Hold"),
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Roadmap</h1>
            <p className="text-[#2B2725]/70">Track features, bugs, and enhancements</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]" onClick={resetForm}>
                <Plus size={20} className="mr-2" />
                Add Roadmap Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit" : "Add"} Roadmap Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Feature">Feature</SelectItem>
                        <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                        <SelectItem value="Enhancement">Enhancement</SelectItem>
                        <SelectItem value="Content">Content</SelectItem>
                        <SelectItem value="Integration">Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Testing">Testing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <Input
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingItem ? "Update" : "Create"} Item
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 mb-6 flex flex-wrap gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Testing">Testing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Roadmap">Roadmap Items</SelectItem>
              <SelectItem value="BugTracker">Bug Tracker Items</SelectItem>
            </SelectContent>
          </Select>
          {sourceFilter !== "all" && (
            <span className="text-sm text-[#2B2725]/60">
              Showing: <strong>{sourceFilter === "BugTracker" ? "Bug Tracker" : "Roadmap"}</strong> items only
            </span>
          )}
        </div>

        {/* Kanban Board */}
        <div className="grid lg:grid-cols-5 gap-6">
          {Object.entries(groupedByStatus).map(([status, items]) => (
            <div key={status} className="bg-white p-4">
              <h3 className="font-medium text-[#1E3A32] mb-4 flex items-center justify-between">
                {status}
                <span className="text-sm text-[#2B2725]/60">({items.length})</span>
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F9F5EF] p-4 rounded hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetail(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-[#1E3A32]">{item.title}</h4>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => handleDelete(item.id, item.title)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 ${
                        item.priority === "Critical" ? "bg-red-100 text-red-800" :
                        item.priority === "High" ? "bg-orange-100 text-orange-800" :
                        item.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {item.priority}
                      </span>
                      <span className="text-xs px-2 py-1 bg-[#D8B46B]/20 text-[#2B2725]">
                        {item.category}
                      </span>
                      {item.source === "BugTracker" && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800">
                          Bug Tracker
                        </span>
                      )}
                    </div>
                    {item.due_date && (
                      <p className="text-xs text-[#2B2725]/60 flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(item.due_date), "MMM d")}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail View Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedItem.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-sm px-3 py-1 ${
                      selectedItem.priority === "Critical" ? "bg-red-100 text-red-800" :
                      selectedItem.priority === "High" ? "bg-orange-100 text-orange-800" :
                      selectedItem.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {selectedItem.priority} Priority
                    </span>
                    <span className="text-sm px-3 py-1 bg-[#D8B46B]/20 text-[#2B2725]">
                      {selectedItem.category}
                    </span>
                    <span className="text-sm px-3 py-1 bg-[#A6B7A3]/20 text-[#1E3A32]">
                      {selectedItem.status}
                    </span>
                    {selectedItem.source === "BugTracker" && (
                      <span className="text-sm px-3 py-1 bg-purple-100 text-purple-800">
                        Bug Tracker
                      </span>
                    )}
                  </div>

                  {selectedItem.description && (
                    <div>
                      <h3 className="font-medium text-[#1E3A32] mb-2">Description</h3>
                      <p className="text-[#2B2725]/80 leading-relaxed whitespace-pre-wrap">
                        {selectedItem.description}
                      </p>
                    </div>
                  )}

                  {selectedItem.notes && (
                    <div>
                      <h3 className="font-medium text-[#1E3A32] mb-2">Notes</h3>
                      <p className="text-[#2B2725]/80 leading-relaxed whitespace-pre-wrap">
                        {selectedItem.notes}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.assigned_to && (
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-1 text-sm">Assigned To</h3>
                        <p className="text-[#2B2725]/80">{selectedItem.assigned_to}</p>
                      </div>
                    )}
                    {selectedItem.due_date && (
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-1 text-sm">Due Date</h3>
                        <p className="text-[#2B2725]/80">{format(new Date(selectedItem.due_date), "MMMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleEdit(selectedItem);
                      }}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Item
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleDelete(selectedItem.id, selectedItem.title);
                      }}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}