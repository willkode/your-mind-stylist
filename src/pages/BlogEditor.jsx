import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Save, Trash2, ArrowLeft, Calendar, Sparkles, Image as ImageIcon, TrendingUp, BarChart3, FileText } from "lucide-react";
import ContentStudio from "../components/blog/ContentStudio";
import AIContentGenerator from "../components/blog/AIContentGenerator";
import ImageManager from "../components/blog/ImageManager";
import SEOAnalyzer from "../components/blog/SEOAnalyzer";
import BlogAnalyticsDashboard from "../components/blog/BlogAnalyticsDashboard";
import BlogSummarizer from "../components/blog/BlogSummarizer";
import VideoEmbedPreview from "../components/blog/VideoEmbedPreview";

const EMPTY_FORM = {
  title: "",
  slug: "",
  author_id: "",
  category: "Emotional Intelligence",
  post_type: "written",
  video_embed_url: "",
  excerpt: "",
  content: "",
  featured_image: "",
  tags: [],
  status: "draft",
  publish_date: "",
  meta_title: "",
  meta_description: "",
  seo_keywords: [],
};

export default function BlogEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const initialized = useRef(false);

  // Load everything on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [currentUser, allAuthors] = await Promise.all([
          base44.auth.me(),
          base44.entities.Author.list(),
        ]);
        setUser(currentUser);
        setAuthors(allAuthors);

        if (id) {
          // Editing existing post — fetch it and populate form
          const posts = await base44.entities.BlogPost.filter({ id });
          const post = posts[0];
          if (post) {
            setFormData({
              title: post.title || "",
              slug: post.slug || "",
              author_id: post.author_id || "",
              category: post.category || "Emotional Intelligence",
              post_type: post.post_type || "written",
              video_embed_url: post.video_embed_url || "",
              excerpt: post.excerpt || "",
              content: post.content || "",
              featured_image: post.featured_image || "",
              tags: post.tags || [],
              status: post.status || "draft",
              publish_date: post.publish_date ? post.publish_date.slice(0, 16) : "",
              meta_title: post.meta_title || "",
              meta_description: post.meta_description || "",
              seo_keywords: post.seo_keywords || [],
            });
          }
        } else {
          // New post — pre-fill author
          const userAuthor = allAuthors.find(a => a.user_id === currentUser.id);
          if (userAuthor) {
            setFormData(prev => ({ ...prev, author_id: userAuthor.id }));
          }
        }
      } catch (e) {
        console.error("BlogEditor init error", e);
      } finally {
        setIsLoading(false);
        initialized.current = true;
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate slug from title for NEW posts only
  useEffect(() => {
    if (!initialized.current || id) return;
    if (formData.title) {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      navigate(createPageUrl("BlogManager"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      navigate(createPageUrl("BlogManager"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      navigate(createPageUrl("BlogManager"));
    },
  });

  const handleSave = (status) => {
    if (user && authors.length > 0) {
      const userAuthor = authors.find(a => a.user_id === user.id);
      if (userAuthor?.is_guest && status === "published") {
        status = "pending_review";
      }
    }
    const dataToSave = { ...formData, status };
    if (id) {
      updateMutation.mutate({ id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAIInsert = (content) => {
    setFormData(prev => ({ ...prev, content: prev.content + "\n\n" + content }));
  };

  const handleImageInsert = (imageUrl) => {
    const imgHtml = `<p><img src="${imageUrl}" alt="" style="max-width: 100%; height: auto;" /></p>`;
    setFormData(prev => ({ ...prev, content: prev.content + imgHtml }));
  };

  const handleFeaturedImageSet = (imageUrl) => {
    setFormData(prev => ({ ...prev, featured_image: imageUrl }));
  };

  const handleVideoInsert = (embedUrl) => {
    const videoHtml = `<p><iframe class="blog-video" src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></p>`;
    setFormData(prev => ({ ...prev, content: prev.content + videoHtml }));
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6 flex items-center justify-center">
        <p className="text-[#2B2725]/60">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6 pr-[26rem]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("BlogManager"))} className="mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Back to Blog Manager
          </Button>
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
            {id ? "Edit Blog Post" : "New Blog Post"}
          </h1>
          <p className="text-[#2B2725]/70">The Mind Styling Journal</p>
        </div>

        <div className="bg-white p-8 space-y-6">
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your post title…"
            />
          </div>

          {/* Slug */}
          <div>
            <Label>Slug (URL)</Label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            />
            <p className="text-xs text-[#2B2725]/60 mt-1">This becomes the URL of your post</p>
          </div>

          {/* Author */}
          <div>
            <Label>Author</Label>
            <Select value={formData.author_id} onValueChange={(v) => setFormData(prev => ({ ...prev, author_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                {authors.map(author => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.display_name} {author.is_guest && "(Guest)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#2B2725]/60 mt-1">
              Don't see your name? <Link to={createPageUrl("AuthorProfile")} className="text-[#1E3A32] underline">Set up your author profile</Link>
            </p>
          </div>

          {/* Post Type */}
          <div>
            <Label>Post Type</Label>
            <Select value={formData.post_type || "written"} onValueChange={(v) => setFormData(prev => ({ ...prev, post_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="written">Written Article</SelectItem>
                <SelectItem value="video">Video Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video Embed URL (only for video posts) */}
          {formData.post_type === "video" && (
            <div>
              <Label>Video Embed URL</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.video_embed_url || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_embed_url: e.target.value }))}
                  placeholder="https://www.youtube.com/embed/... or https://player.vimeo.com/video/..."
                />
                <Button
                  variant="outline"
                  onClick={() => setVideoPreviewOpen(true)}
                  disabled={!formData.video_embed_url}
                >
                  Preview
                </Button>
              </div>
              <p className="text-xs text-[#2B2725]/60 mt-1">Paste the embed URL from YouTube or Vimeo</p>
            </div>
          )}

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Restyle Monday">Restyle Monday</SelectItem>
                <SelectItem value="Thursday Tailoring">Thursday Tailoring</SelectItem>
                <SelectItem value="Emotional Intelligence">Emotional Intelligence</SelectItem>
                <SelectItem value="Culture">Culture</SelectItem>
                <SelectItem value="Leadership & Teams">Leadership & Teams</SelectItem>
                <SelectItem value="Communication">Communication</SelectItem>
                <SelectItem value="Identity & Confidence">Identity & Confidence</SelectItem>
                <SelectItem value="Stress & Regulation">Stress & Regulation</SelectItem>
                <SelectItem value="Relationships">Relationships</SelectItem>
                <SelectItem value="Inner Rehearsal">Inner Rehearsal</SelectItem>
                <SelectItem value="Hypnosis & the Brain">Hypnosis & the Brain</SelectItem>
                <SelectItem value="Personal & Professional Development">Personal & Professional Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Excerpt */}
          <div>
            <Label>Excerpt</Label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Write a short summary to show on the blog list"
              rows={3}
            />
          </div>

          {/* AI Summarizer */}
          <div className="border border-[#6E4F7D]/20 rounded-lg p-6 bg-gradient-to-br from-[#6E4F7D]/5 to-[#D8B46B]/5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-[#6E4F7D]" />
              <h3 className="font-serif text-lg text-[#1E3A32]">AI Blog Summarizer</h3>
            </div>
            <BlogSummarizer onApplySummary={(summary) => setFormData(prev => ({ ...prev, excerpt: summary }))} />
          </div>

          {/* AI Content Generator */}
          <div className="border border-[#6E4F7D]/20 rounded-lg p-6 bg-gradient-to-br from-[#6E4F7D]/5 to-[#D8B46B]/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-[#6E4F7D]" />
              <h3 className="font-serif text-lg text-[#1E3A32]">AI Content Generator</h3>
            </div>
            <AIContentGenerator onInsert={handleAIInsert} />
          </div>

          {/* Content */}
          <div>
            <Label className="mb-2 block">Main Content</Label>
            <ReactQuill
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              theme="snow"
              modules={quillModules}
              style={{ minHeight: "400px" }}
            />
          </div>

          {/* Insert Image */}
          <div className="border border-[#D8B46B]/20 rounded-lg p-6 bg-[#F9F5EF]">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={20} className="text-[#D8B46B]" />
              <h3 className="font-serif text-lg text-[#1E3A32]">Insert Image</h3>
            </div>
            <ImageManager onInsert={handleImageInsert} mode="insert" />
          </div>

          {/* Insert Video */}
          <div className="border border-[#6E4F7D]/20 rounded-lg p-6 bg-gradient-to-br from-[#6E4F7D]/5 to-[#D8B46B]/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-[#6E4F7D]" />
              <h3 className="font-serif text-lg text-[#1E3A32]">Insert Video</h3>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="https://www.youtube.com/embed/... or https://player.vimeo.com/video/..."
                onChange={(e) => setFormData(prev => ({ ...prev, _videoUrl: e.target.value }))}
              />
              <Button
                onClick={() => {
                  if (formData._videoUrl) {
                    handleVideoInsert(formData._videoUrl);
                    setFormData(prev => ({ ...prev, _videoUrl: "" }));
                  }
                }}
                className="w-full bg-[#6E4F7D] hover:bg-[#5D4469]"
              >
                Insert Video
              </Button>
              <p className="text-xs text-[#2B2725]/60">Paste the embed URL from YouTube or Vimeo. Use the post type dropdown above for a full-width hero video.</p>
            </div>
          </div>

          {/* Featured Image */}
          <div className="border border-[#D8B46B]/20 rounded-lg p-6 bg-[#F9F5EF]">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={20} className="text-[#D8B46B]" />
              <h3 className="font-serif text-lg text-[#1E3A32]">Featured Image</h3>
            </div>
            <p className="text-xs text-[#2B2725]/60 mb-4">
              This image appears as the blog thumbnail on the blog listing page and in social sharing previews. It is separate from images you insert in the body text above.
            </p>
            {!formData.featured_image && formData.content && (() => {
              const match = formData.content.match(/<img[^>]+src=["']([^"']+)["']/);
              return match ? (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featured_image: match[1] }))}
                  className="mb-4 text-xs text-[#D8B46B] hover:text-[#1E3A32] underline transition-colors"
                >
                  Auto-detect from content — use first image in body text
                </button>
              ) : null;
            })()}
            {formData.featured_image && (
              <div className="mb-4">
                <img
                  src={formData.featured_image}
                  alt="Featured"
                  className="w-full max-h-64 object-cover rounded border border-[#E4D9C4]"
                />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, featured_image: "" }))}
                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                >
                  Remove featured image
                </button>
              </div>
            )}
            <ImageManager onSetFeaturedImage={handleFeaturedImageSet} mode="featured" />
          </div>

          {/* SEO */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-[#1E3A32] mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              SEO Settings
            </h3>
            <div className="space-y-4">
              <div className="border border-[#1E3A32]/20 rounded-lg p-6 bg-gradient-to-br from-[#1E3A32]/5 to-[#A6B7A3]/5">
                <SEOAnalyzer
                  title={formData.title}
                  content={formData.content}
                  excerpt={formData.excerpt}
                  onApplySEO={(seoData) => setFormData(prev => ({ ...prev, ...seoData }))}
                />
              </div>
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  rows={2}
                />
              </div>
              {formData.seo_keywords && formData.seo_keywords.length > 0 && (
                <div>
                  <Label>SEO Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.seo_keywords.map((keyword, idx) => (
                      <Badge key={idx} className="bg-[#A6B7A3]/20 text-[#1E3A32]">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Publish Settings */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-[#1E3A32] mb-4">Publish Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Publish Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.publish_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">Schedule this post to go live automatically</p>
              </div>
            </div>
          </div>

          {/* Analytics */}
          {id && formData.status === "published" && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-[#1E3A32] mb-4 flex items-center gap-2">
                <BarChart3 size={18} />
                Post Analytics
              </h3>
              <BlogAnalyticsDashboard blogPostId={id} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-between border-t pt-6">
            <div>
              {id && (
                <Button variant="outline" className="text-red-600" onClick={handleDelete}>
                  <Trash2 size={18} className="mr-2" />
                  Delete Post
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave("draft")}>
                <Save size={18} className="mr-2" />
                Save Draft
              </Button>
              {formData.publish_date && new Date(formData.publish_date) > new Date() && formData.status !== "published" ? (
                <Button onClick={() => handleSave("scheduled")} className="bg-[#6E4F7D] hover:bg-[#5D4469]">
                  <Calendar size={18} className="mr-2" />
                  Schedule
                </Button>
              ) : formData.status === "published" ? (
                <Button onClick={() => handleSave("published")} className="bg-[#1E3A32] hover:bg-[#2B2725]">
                  <Save size={18} className="mr-2" />
                  Update
                </Button>
              ) : (
                <Button onClick={() => handleSave("published")} className="bg-[#1E3A32] hover:bg-[#2B2725]">
                  <Calendar size={18} className="mr-2" />
                  Publish Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContentStudio
        blogContent={formData}
        onApplySEO={(seoData) => setFormData(prev => ({
          ...prev,
          meta_title: seoData.meta_title,
          meta_description: seoData.meta_description
        }))}
      />

      {/* Video Preview Modal */}
      <VideoEmbedPreview
        embedUrl={videoPreviewOpen ? formData.video_embed_url : null}
        onClose={() => setVideoPreviewOpen(false)}
      />
    </div>
  );
}