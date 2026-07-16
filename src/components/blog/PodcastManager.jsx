import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink, X, Save } from "lucide-react";
import { format } from "date-fns";

const EMPTY_FORM = {
  show_name: "",
  episode_title: "",
  description: "",
  episode_url: "",
  embed_url: "",
  thumbnail: "",
  air_date: "",
  status: "published",
};

function PodcastForm({ episode, onSave, onCancel }) {
  const [form, setForm] = useState(episode || EMPTY_FORM);
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="bg-[#F9F5EF] border border-[#E4D9C4] p-6 rounded-lg space-y-4">
      <h3 className="font-serif text-xl text-[#1E3A32]">{episode ? "Edit Episode" : "Add Podcast Episode"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Show Name *</Label>
          <Input value={form.show_name} onChange={e => set("show_name", e.target.value)} placeholder="e.g. The Mind Stylist Podcast" />
        </div>
        <div>
          <Label>Episode Title *</Label>
          <Input value={form.episode_title} onChange={e => set("episode_title", e.target.value)} placeholder="e.g. Rewiring Your Inner Dialogue" />
        </div>
        <div>
          <Label>Air Date</Label>
          <Input type="date" value={form.air_date} onChange={e => set("air_date", e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Episode URL</Label>
          <Input value={form.episode_url} onChange={e => set("episode_url", e.target.value)} placeholder="https://open.spotify.com/episode/..." />
          <p className="text-xs text-[#2B2725]/60 mt-1">Spotify, Apple Podcasts, or any direct link</p>
        </div>
        <div className="md:col-span-2">
          <Label>Embed URL (optional)</Label>
          <Input value={form.embed_url} onChange={e => set("embed_url", e.target.value)} placeholder="https://open.spotify.com/embed/episode/..." />
          <p className="text-xs text-[#2B2725]/60 mt-1">Spotify/Apple embed URL to show a player inline</p>
        </div>
        <div className="md:col-span-2">
          <Label>Thumbnail Image URL</Label>
          <Input value={form.thumbnail} onChange={e => set("thumbnail", e.target.value)} placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Brief description of what the episode covers…" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>
          <X size={16} className="mr-2" /> Cancel
        </Button>
        <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-white" onClick={() => onSave(form)}>
          <Save size={16} className="mr-2" /> Save Episode
        </Button>
      </div>
    </div>
  );
}

export default function PodcastManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null = not editing, {} = new, episode = editing existing
  const [showForm, setShowForm] = useState(false);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["podcastEpisodes"],
    queryFn: () => base44.entities.PodcastAppearance.list("-air_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastAppearance.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["podcastEpisodes"] }); setShowForm(false); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PodcastAppearance.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["podcastEpisodes"] }); setShowForm(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PodcastAppearance.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["podcastEpisodes"] }),
  });

  const handleSave = (form) => {
    if (editing?.id) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (ep) => { setEditing(ep); setShowForm(true); };
  const handleNew = () => { setEditing(null); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditing(null); };
  const handleDelete = (ep) => {
    if (window.confirm(`Delete "${ep.episode_title}"?`)) deleteMutation.mutate(ep.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl text-[#1E3A32]">Podcast Appearances</h2>
          <p className="text-sm text-[#2B2725]/60 mt-1">Manage episodes shown on the Podcast page</p>
        </div>
        {!showForm && (
          <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-white" onClick={handleNew}>
            <Plus size={18} className="mr-2" /> Add Episode
          </Button>
        )}
      </div>

      {showForm && (
        <PodcastForm episode={editing} onSave={handleSave} onCancel={handleCancel} />
      )}

      {isLoading ? (
        <div className="p-12 text-center text-[#2B2725]/60">Loading episodes...</div>
      ) : episodes.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E4D9C4]">
          <p className="text-[#2B2725]/60">No podcast episodes yet.</p>
          <p className="text-[#2B2725]/40 text-sm mt-1">Add your first episode to have it appear on the Podcast page.</p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden border border-[#E4D9C4]">
          <table className="w-full">
            <thead className="bg-[#F9F5EF]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Episode</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Show</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Air Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-[#2B2725]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D9C4]">
              {episodes.map(ep => (
                <tr key={ep.id} className="hover:bg-[#F9F5EF]/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#1E3A32]">{ep.episode_title}</p>
                    {ep.description && <p className="text-xs text-[#2B2725]/60 mt-1 line-clamp-1">{ep.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#2B2725]/70">{ep.show_name}</td>
                  <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                    {ep.air_date ? format(new Date(ep.air_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs uppercase tracking-wide ${
                      ep.status === "published" ? "bg-[#A6B7A3]/20 text-[#1E3A32]" : "bg-[#E4D9C4] text-[#2B2725]/70"
                    }`}>
                      {ep.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {ep.episode_url && (
                        <a href={ep.episode_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="text-[#1E3A32]" title="Open episode">
                            <ExternalLink size={16} />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="text-[#1E3A32]" onClick={() => handleEdit(ep)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(ep)}>
                        <Trash2 size={16} />
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
  );
}