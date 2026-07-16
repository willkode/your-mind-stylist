import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Sparkles, RefreshCw, Download, Upload, Package, BookOpen, Video, GraduationCap, Info, GripVertical, Gift, ExternalLink, Headphones } from "lucide-react";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import BundleCreator from "../components/manager/BundleCreator";
import ProductCard from "../components/manager/ProductCard";
import GiftCodeGenerator from "../components/manager/GiftCodeGenerator";
import PurchaseOptionsEditor from "../components/manager/PurchaseOptionsEditor";
import ProductResourcesPanel from "../components/manager/ProductResourcesPanel";
import { Dialog as GiftDialog, DialogContent as GiftDialogContent, DialogHeader as GiftDialogHeader, DialogTitle as GiftDialogTitle } from "@/components/ui/dialog";

export default function ManagerProducts() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [giftProduct, setGiftProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef(null);
  const bookCoverInputRef = React.useRef(null);

  const [formData, setFormData] = useState({
    key: "",
    slug: "",
    name: "",
    tagline: "",
    short_description: "",
    long_description: "",
    type: "one_time",
    product_subtype: "",
    category: "foundation",
    price: "",
    currency: "usd",
    billing_interval: "one_time",
    features: [""],
    icon: "",
    color: "#1E3A32",
    status: "draft",
    ui_group: "standard",
    display_order: 0,
    template_choice: "detailed",
    related_course_id: "",
    access_grants: [],
    payment_plan_options: [],
    book_cover_image: "",
    book_hero_layout: "book_left",
    book_video_embed: "",
    book_reviews: [],
    purchase_options: [],
  });
  const [enablePaymentPlans, setEnablePaymentPlans] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date"),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("title"),
  });

  const { data: audiobooks = [] } = useQuery({
    queryKey: ["audiobooks"],
    queryFn: () => base44.entities.Audiobook.list(),
  });

  // Build a map of product_id → audiobook for quick lookup
  const audiobookByProductId = React.useMemo(() => {
    const map = {};
    audiobooks.forEach((ab) => {
      if (ab.product_id) map[ab.product_id] = ab;
    });
    return map;
  }, [audiobooks]);



  const createMutation = useMutation({
    mutationFn: async (productData) => {
      const created = await base44.entities.Product.create(productData);
      
      // Auto-sync with Stripe
      const syncResult = await base44.functions.invoke('syncProductStripe', {
        product_id: created.id,
        key: productData.key,
        name: productData.name,
        description: productData.short_description,
        price: parseInt(productData.price) || 0,
        currency: productData.currency,
        billing_interval: productData.billing_interval,
        type: productData.type,
      });

      if (syncResult.data.success) {
        await base44.entities.Product.update(created.id, {
          stripe_product_id: syncResult.data.stripe_product_id,
          stripe_price_id: syncResult.data.stripe_price_id,
          stripe_price_ids: syncResult.data.stripe_price_ids,
        });
      }

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created and synced with Stripe!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log('[updateMutation] saving product', id, JSON.stringify(data).slice(0, 500));
      const updated = await base44.entities.Product.update(id, data);
      console.log('[updateMutation] product saved, syncing to Stripe...');
      
      // Auto-sync with Stripe (non-blocking — don't let Stripe failures prevent save)
      try {
        const syncResult = await base44.functions.invoke('syncProductStripe', {
          product_id: id,
          key: data.key,
          name: data.name,
          description: data.short_description,
          price: parseInt(data.price) || 0,
          currency: data.currency,
          billing_interval: data.billing_interval,
          type: data.type,
        });

        if (syncResult.data?.success) {
          await base44.entities.Product.update(id, {
            stripe_product_id: syncResult.data.stripe_product_id,
            stripe_price_id: syncResult.data.stripe_price_id,
            stripe_price_ids: syncResult.data.stripe_price_ids,
          });
        }
      } catch (stripeErr) {
        console.warn('[updateMutation] Stripe sync failed (product still saved):', stripeErr);
        toast.error('Product saved but Stripe sync failed — you can retry via Sync All.');
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated and synced with Stripe!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('[updateMutation] error:', error);
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.Product.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSyncAll = async () => {
    setSyncing(true);
    let synced = 0;
    let failed = 0;
    try {
      for (const product of products) {
        try {
          const syncResult = await base44.functions.invoke('syncProductStripe', {
            product_id: product.id,
            key: product.key,
            name: product.name,
            description: product.short_description,
            price: product.price || 0,
            currency: product.currency,
            billing_interval: product.billing_interval,
            type: product.type,
            payment_plan_options: product.payment_plan_options,
          });
          if (syncResult.data?.success) {
            await base44.entities.Product.update(product.id, {
              stripe_product_id: syncResult.data.stripe_product_id,
              stripe_price_id: syncResult.data.stripe_price_id,
              stripe_price_ids: syncResult.data.stripe_price_ids,
            });
            synced++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Failed to sync ${product.name}:`, err);
          failed++;
        }
      }
      if (failed > 0) {
        toast.error(`Synced ${synced}, failed ${failed}. Check console for details.`);
      } else {
        toast.success(`All ${synced} products synced with Stripe!`);
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      key: "",
      slug: "",
      name: "",
      tagline: "",
      short_description: "",
      long_description: "",
      type: "one_time",
      product_subtype: "",
      category: "foundation",
      price: "",
      currency: "usd",
      billing_interval: "one_time",
      features: [""],
      icon: "",
      color: "#1E3A32",
      status: "draft",
      ui_group: "standard",
      display_order: 0,
      template_choice: "detailed",
      related_course_id: "",
      related_webinar_id: "",
      access_grants: [],
      payment_plan_options: [],
      book_cover_image: "",
      book_hero_layout: "book_left",
      book_video_embed: "",
      book_reviews: [],
      purchase_options: [],
    });
    setEditingProduct(null);
    setEnablePaymentPlans(false);
  };

  const handleEdit = (product) => {
    // If it's a bundle, open the bundle editor
    if (product.is_bundle || product.type === "bundle") {
      setEditingBundle(product);
      setBundleDialogOpen(true);
      return;
    }
    
    setEditingProduct(product);
    const hasPlan = product.payment_plan_options && product.payment_plan_options.length > 0;
    setFormData({
      ...product,
      slug: product.slug || "",
      price: product.price ? (product.price / 100).toString() : "",
      features: product.features || [""],
      template_choice: product.template_choice || "detailed",
      product_subtype: product.product_subtype || "",
      related_course_id: product.related_course_id || "",
      related_webinar_id: product.related_webinar_id || "",
      access_grants: product.access_grants || [],
      payment_plan_options: product.payment_plan_options || [],
      book_cover_image: product.book_cover_image || "",
      book_hero_layout: product.book_hero_layout || "book_left",
      book_video_embed: product.book_video_embed || "",
      book_reviews: product.book_reviews || [],
      requires_shipping: product.requires_shipping || false,
      purchase_options: (product.purchase_options || []).map(opt => {
        // Parse JSON-encoded product_id arrays back for the editor UI
        if (opt.product_id && typeof opt.product_id === 'string' && opt.product_id.startsWith('[')) {
          try { return { ...opt, product_id: JSON.parse(opt.product_id) }; } catch (e) { /* keep as-is */ }
        }
        return opt;
      }),
    });
    setEnablePaymentPlans(hasPlan);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    // Clean up purchase_options: strip inline-creation temp fields
    // For bundle-type options, product_id may be an array — store as JSON string
    // since the API requires product_id to be a string
    const cleanedOptions = (formData.purchase_options || []).map(opt => {
      const { _inline, _variant_name, _variant_price, ...clean } = opt;
      // Convert array product_id to JSON string for storage
      if (Array.isArray(clean.product_id)) {
        clean.product_id = JSON.stringify(clean.product_id);
      }
      return clean;
    });

    // Strip read-only / built-in fields that the API rejects on update
    // Also strip Stripe fields — those are managed by the sync step, not the form
    const {
      id, created_date, created_by, updated_date,
      stripe_product_id, stripe_price_id, stripe_price_ids,
      ...writableFields
    } = formData;

    const dataToSave = {
      ...writableFields,
      price: formData.price ? parseInt(parseFloat(formData.price) * 100) : 0,
      features: (formData.features || []).filter(f => f.trim() !== ""),
      purchase_options: cleanedOptions,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const updateFeature = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const removeFeature = (index) => {
    const updated = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updated });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Products exported as JSON');
  };

  const handleExportCSV = () => {
    const headers = ['key', 'slug', 'name', 'tagline', 'short_description', 'type', 'category', 'price', 'currency', 'billing_interval', 'status', 'ui_group', 'template_choice'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.key || '',
        p.slug || '',
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.tagline || '').replace(/"/g, '""')}"`,
        `"${(p.short_description || '').replace(/"/g, '""')}"`,
        p.type || '',
        p.category || '',
        p.price || 0,
        p.currency || 'usd',
        p.billing_interval || 'one_time',
        p.status || 'draft',
        p.ui_group || 'standard',
        p.template_choice || 'detailed'
      ].join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Products exported as CSV');
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      let importData = [];

      if (file.name.endsWith('.json')) {
        importData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        importData = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          const obj = {};
          headers.forEach((header, i) => {
            let value = values[i]?.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
            if (header === 'price') value = parseInt(value) || 0;
            obj[header] = value;
          });
          return obj;
        });
      }

      let created = 0;
      let errors = [];

      for (const item of importData) {
        try {
          const existing = products.find(p => p.key === item.key);
          if (existing) {
            await base44.entities.Product.update(existing.id, item);
          } else {
            await base44.entities.Product.create(item);
            created++;
          }
        } catch (error) {
          errors.push(`Failed to import ${item.key}: ${error.message}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      if (errors.length > 0) {
        toast.error(`Imported with ${errors.length} errors. Check console.`);
        console.error('Import errors:', errors);
      } else {
        toast.success(`Successfully imported ${created} new products`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const categoryLabels = {
    foundation: "Tier 1: Foundation",
    mid_level: "Tier 2: Mid-Level",
    high_touch: "Tier 3: High-Touch",
    advanced: "Advanced",
  };

  // Group by subtype for the new view, then fall back to category
  // 5 segment groups matching the Programs page bands
  const SUBTYPE_GROUPS = [
    { key: "signature_services", label: "✨ Signature Services", description: "One-on-one sessions, coaching & private programs" },
    { key: "webinar", label: "📹 Webinars & Live Events", description: "Live & recorded webinars" },
    { key: "book", label: "📖 Books & Resources", description: "Books & written resources" },
    { key: "course", label: "🎓 Hypnosis Training", description: "Certification & professional training programs" },
    { key: "other", label: "🌟 Other Programs & Tools", description: "Additional resources and offerings" },
    { key: "bundle", label: "🎁 Bundles & Packages", description: "Product bundles at special prices" },
  ];

  const groupedProducts = SUBTYPE_GROUPS.map(group => ({
    ...group,
    items: products.filter(p => {
      if (group.key === "bundle") return p.is_bundle || p.type === "bundle";
      if (group.key === "signature_services") return (!p.product_subtype || p.product_subtype === "" || p.product_subtype === "digital_service" || p.product_subtype === "physical_product") && !p.is_bundle && p.type !== "bundle";
      return p.product_subtype === group.key && !p.is_bundle && p.type !== "bundle";
    }).sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
  }));

  if (isLoading) {
    return <div className="p-8">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Product Manager</h1>
            <p className="text-[#2B2725]/70">
              Manage your offerings and sync with Stripe automatically
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setEditingBundle(null);
                setBundleDialogOpen(true);
              }}
              className="bg-[#6E4F7D] hover:bg-[#8B659B]"
            >
              <Package size={16} className="mr-2" />
              Create Bundle
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const menu = document.createElement('div');
                menu.style.cssText = 'position:absolute;background:white;border:1px solid #E4D9C4;border-radius:4px;padding:8px;z-index:100;';
                menu.innerHTML = `
                  <button class="export-json" style="display:block;width:100%;text-align:left;padding:8px;border:none;background:none;cursor:pointer;font-size:14px;">Export as JSON</button>
                  <button class="export-csv" style="display:block;width:100%;text-align:left;padding:8px;border:none;background:none;cursor:pointer;font-size:14px;">Export as CSV</button>
                `;
                document.body.appendChild(menu);
                const rect = event.target.getBoundingClientRect();
                menu.style.top = rect.bottom + 5 + 'px';
                menu.style.left = rect.left + 'px';

                menu.querySelector('.export-json').onclick = () => {
                  handleExportJSON();
                  document.body.removeChild(menu);
                };
                menu.querySelector('.export-csv').onclick = () => {
                  handleExportCSV();
                  document.body.removeChild(menu);
                };

                setTimeout(() => {
                  const closeMenu = () => document.body.contains(menu) && document.body.removeChild(menu);
                  document.addEventListener('click', closeMenu, { once: true });
                }, 100);
              }}
              className="border-[#D8B46B]"
            >
              <Download size={16} className="mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="border-[#D8B46B]"
            >
              <Upload size={16} className={`mr-2 ${importing ? "animate-pulse" : ""}`} />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncing}
              className="border-[#D8B46B]"
              title="Sync all products to Stripe (prices, names, descriptions)"
            >
              <RefreshCw size={16} className={`mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync All to Stripe"}
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Plus size={16} className="mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Products grouped by subtype */}
        {groupedProducts.map(group => (
          <div key={group.key || "no-subtype"} className="mb-10">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-serif text-2xl text-[#1E3A32]">{group.label}</h2>
              <span className="text-sm text-[#2B2725]/50">{group.items.length} product{group.items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {group.items.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-[#E4D9C4] hover:border-[#D8B46B]/50 transition-all">
                  <GripVertical size={18} className="text-[#D8B46B]/50 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[#1E3A32] truncate">{product.name}</h3>
                      {product.ui_group === "hidden" && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#2B2725]/10 text-[#2B2725]/60 flex-shrink-0 font-medium">
                          Variant
                        </span>
                      )}
                      {product.ui_group === "featured" && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#D8B46B]/20 text-[#D8B46B] flex-shrink-0 font-medium">
                          Public
                        </span>
                      )}
                      {product.ui_group === "standard" && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#A6B7A3]/20 text-[#1E3A32]/70 flex-shrink-0 font-medium">
                          Public
                        </span>
                      )}
                      {audiobookByProductId[product.id] && (
                        <a
                          href="/ManagerAudiobooks"
                          className="inline-flex items-center gap-1 text-xs text-[#6E4F7D] hover:text-[#1E3A32] transition-colors flex-shrink-0"
                          title={`Linked audiobook: ${audiobookByProductId[product.id].title}`}
                        >
                          <Headphones size={12} /> Audiobook
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-[#2B2725]/60">{product.status === 'published' ? '✓ Published' : 'Draft'}</p>
                  </div>
                  <span className="text-sm font-medium text-[#1E3A32] flex-shrink-0">
                    {product.price ? `$${(product.price/100).toFixed(2)}` : 'Free'}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)}><Edit size={14}/></Button>
                    <Button size="sm" variant="outline" title="Generate Gift Code" onClick={() => { setGiftProduct(product); setGiftDialogOpen(true); }}><Gift size={14}/></Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-[#6E4F7D] border-[#6E4F7D]/30 hover:bg-[#6E4F7D]/10"
                      title={product.related_course_id ? "Preview course content" : "Preview product page"}
                      onClick={() => {
                        if (product.related_course_id) {
                          window.open(`/CoursePage?id=${product.related_course_id}`, '_blank');
                        } else if (product.slug) {
                          window.open(`/ProductPage?slug=${product.slug}&preview=true`, '_blank');
                        } else {
                          toast.error('Add a slug or link a course to preview this product');
                        }
                      }}
                    ><ExternalLink size={14} className="mr-1"/> Preview</Button>
                    <Button 
                      size="sm" 
                      variant={product.status === 'published' ? 'default' : 'outline'}
                      onClick={() => toggleStatusMutation.mutate({ id: product.id, status: product.status === "published" ? "draft" : "published" })}
                      className={product.status === 'published' ? 'bg-green-600 hover:bg-green-700' : ''}
                      title={product.status === 'published' ? 'Unpublish' : 'Publish'}
                    ><Eye size={14}/></Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(product.id); }}><Trash2 size={14}/></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legacy category-based display — hidden now, replaced above */}
        {false && ['webinar', 'book', 'course'].map(subtype => {
          const subtypeProducts = products.filter(p => p.product_subtype === subtype);
          if (subtypeProducts.length === 0) return null;
          const label = subtype === 'webinar' ? '📹 Webinars' : subtype === 'book' ? '📖 Books' : '🎓 Hypnosis Classes / Courses';
          return (
            <div key={subtype} className="mb-8 p-4 bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg">
              <h2 className="font-serif text-xl text-[#1E3A32] mb-3">{label} <span className="text-sm font-sans font-normal text-[#2B2725]/60">— {subtypeProducts.length} product{subtypeProducts.length !== 1 ? 's' : ''}</span></h2>
              <div className="flex flex-wrap gap-3">
                {subtypeProducts.map(p => (
                  <div key={p.id} className="bg-white rounded px-4 py-3 border border-[#E4D9C4] flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full ${p.status === 'published' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-medium text-[#1E3A32]">{p.name}</span>
                    <span className="text-[#2B2725]/50">{p.price ? `$${(p.price/100).toFixed(2)}` : 'Free'}</span>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(p)} className="h-7 px-2"><Edit size={12}/></Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {false && Object.entries(categoryLabels).map(([category, label]) => {
          return null;
        })}

        {products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg">
            <Sparkles size={48} className="mx-auto mb-4 text-[#D8B46B]" />
            <p className="text-[#2B2725]/60 mb-4">No products yet. Create your first offering!</p>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Plus size={16} className="mr-2" />
              Add Your First Product
            </Button>
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">

            {/* Quick Guide */}
            {!editingProduct && (
              <div className="bg-[#1E3A32]/5 border border-[#1E3A32]/20 rounded-lg p-4 text-sm text-[#1E3A32]">
                <p className="font-semibold mb-2 flex items-center gap-2"><Info size={14}/> What type of product are you creating?</p>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, product_subtype: '', type: 'one_time', category: 'high_touch' }))}
                    className={`p-3 rounded border text-center transition-all ${!formData.product_subtype ? 'border-[#1E3A32] bg-[#1E3A32] text-white' : 'border-[#D8B46B] hover:bg-[#D8B46B]/10'}`}
                  >
                    <Sparkles size={16} className="mx-auto mb-1"/>
                    <span className="text-xs font-medium">Signature Service</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, product_subtype: 'webinar', type: 'one_time', category: 'foundation' }))}
                    className={`p-3 rounded border text-center transition-all ${formData.product_subtype === 'webinar' ? 'border-[#1E3A32] bg-[#1E3A32] text-white' : 'border-[#D8B46B] hover:bg-[#D8B46B]/10'}`}
                  >
                    <Video size={16} className="mx-auto mb-1"/>
                    <span className="text-xs font-medium">Webinar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, product_subtype: 'book', type: 'one_time', category: 'foundation' }))}
                    className={`p-3 rounded border text-center transition-all ${formData.product_subtype === 'book' ? 'border-[#1E3A32] bg-[#1E3A32] text-white' : 'border-[#D8B46B] hover:bg-[#D8B46B]/10'}`}
                  >
                    <BookOpen size={16} className="mx-auto mb-1"/>
                    <span className="text-xs font-medium">Book</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, product_subtype: 'course', type: 'one_time', category: 'mid_level' }))}
                    className={`p-3 rounded border text-center transition-all ${formData.product_subtype === 'course' ? 'border-[#1E3A32] bg-[#1E3A32] text-white' : 'border-[#D8B46B] hover:bg-[#D8B46B]/10'}`}
                  >
                    <GraduationCap size={16} className="mx-auto mb-1"/>
                    <span className="text-xs font-medium">Hypnosis Training</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, product_subtype: 'other', type: 'one_time', category: 'foundation' }))}
                    className={`p-3 rounded border text-center transition-all ${formData.product_subtype === 'other' ? 'border-[#1E3A32] bg-[#1E3A32] text-white' : 'border-[#D8B46B] hover:bg-[#D8B46B]/10'}`}
                  >
                    <Package size={16} className="mx-auto mb-1"/>
                    <span className="text-xs font-medium">Other</span>
                  </button>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Product Key * <span className="text-xs font-normal text-[#2B2725]/50">(short internal ID, no spaces)</span></Label>
                <Input
                  value={formData.key}
                  onChange={(e) => {
                    const key = e.target.value;
                    setFormData({ 
                      ...formData, 
                      key,
                      slug: formData.slug || key.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    });
                  }}
                  placeholder="certification"
                />
              </div>
              <div>
                <Label>URL Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="certification-program"
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  yourmindstylist.com/product/{formData.slug || 'slug'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Category * <span className="text-xs font-normal text-[#2B2725]/50">(matches Programs page sections)</span></Label>
                <Select
                  value={formData.product_subtype || ""}
                  onValueChange={(value) => setFormData({ ...formData, product_subtype: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>✨ Signature Services</SelectItem>
                    <SelectItem value="webinar">📹 Webinars & Live Events</SelectItem>
                    <SelectItem value="book">📖 Books & Resources</SelectItem>
                    <SelectItem value="course">🎓 Hypnosis Training</SelectItem>
                    <SelectItem value="other">🌟 Other Programs & Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Page Template</Label>
                <Select
                  value={formData.template_choice}
                  onValueChange={(value) => setFormData({ ...formData, template_choice: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal (Clean & Simple)</SelectItem>
                    <SelectItem value="detailed">Detailed (Full Features)</SelectItem>
                    <SelectItem value="immersive">Immersive (Visual Story)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="The Mind Styling Certification™"
              />
            </div>

            <div>
              <Label>Tagline</Label>
              <Input
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="3-Part Inner Redesign"
              />
            </div>

            <div>
              <Label>Short Description</Label>
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief description for cards"
                rows={3}
              />
            </div>

            <div>
              <Label>Long Description</Label>
              <ReactQuill
                value={formData.long_description}
                onChange={(value) => setFormData({ ...formData, long_description: value })}
                className="bg-white"
              />
            </div>

            {/* Book Cover Image (for book products) */}
            {formData.product_subtype === "book" && (
              <div className="space-y-4 p-4 bg-[#D8B46B]/5 border border-[#D8B46B]/30 rounded-lg">
                <h3 className="font-serif text-lg text-[#1E3A32]">📖 Book Settings</h3>

                {/* Cover Image */}
                <div>
                  <Label>Book Cover Image</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.book_cover_image || ""}
                      onChange={(e) => setFormData({ ...formData, book_cover_image: e.target.value })}
                      placeholder="https://example.com/book-cover.jpg"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => bookCoverInputRef.current?.click()}
                    >
                      <Upload size={14} className="mr-1" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={bookCoverInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const result = await base44.integrations.Core.UploadFile({ file });
                          setFormData({ ...formData, book_cover_image: result.file_url });
                          toast.success('Book cover uploaded!');
                        } catch (error) {
                          toast.error('Failed to upload cover image');
                        }
                      }
                    }}
                  />
                  {formData.book_cover_image && (
                    <div className="mt-3 p-3 bg-[#F9F5EF] rounded-lg border border-[#E4D9C4]">
                      <img src={formData.book_cover_image} alt="Book cover preview" className="w-24 h-32 object-cover rounded" />
                    </div>
                  )}
                </div>

                {/* Hero Layout */}
                <div>
                  <Label>Book Position in Hero</Label>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, book_hero_layout: "book_left" })}
                      className={`flex-1 py-3 px-4 rounded border text-sm font-medium transition-all ${
                        formData.book_hero_layout !== "book_right" ? "border-[#1E3A32] bg-[#1E3A32] text-white" : "border-[#D8B46B] hover:bg-[#D8B46B]/10"
                      }`}
                    >
                      📖 ← Book on Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, book_hero_layout: "book_right" })}
                      className={`flex-1 py-3 px-4 rounded border text-sm font-medium transition-all ${
                        formData.book_hero_layout === "book_right" ? "border-[#1E3A32] bg-[#1E3A32] text-white" : "border-[#D8B46B] hover:bg-[#D8B46B]/10"
                      }`}
                    >
                      Book on Right → 📖
                    </button>
                  </div>
                </div>

                {/* Video Embed */}
                <div>
                  <Label>Author Video Embed URL <span className="text-xs font-normal text-[#2B2725]/50">(YouTube or Vimeo)</span></Label>
                  <Input
                    value={formData.book_video_embed || ""}
                    onChange={(e) => setFormData({ ...formData, book_video_embed: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>

                {/* Purchase Options */}
                <PurchaseOptionsEditor
                  options={formData.purchase_options || []}
                  onChange={(options) => setFormData({ ...formData, purchase_options: options })}
                  currentProductId={editingProduct?.id}
                  parentProductName={formData.name}
                />

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Reader Reviews</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormData({
                        ...formData,
                        book_reviews: [...(formData.book_reviews || []), { quote: "", reviewer: "", reviewer_title: "", stars: 5 }]
                      })}
                    >
                      <Plus size={14} className="mr-1" /> Add Review
                    </Button>
                  </div>
                  {(formData.book_reviews || []).map((review, idx) => (
                    <div key={idx} className="bg-white border border-[#E4D9C4] rounded-lg p-4 mb-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                const updated = [...formData.book_reviews];
                                updated[idx] = { ...updated[idx], stars: s };
                                setFormData({ ...formData, book_reviews: updated });
                              }}
                              className={`text-xl transition-colors ${ s <= (review.stars || 5) ? "text-[#D8B46B]" : "text-gray-200" }`}
                            >★</button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const updated = formData.book_reviews.filter((_, i) => i !== idx);
                            setFormData({ ...formData, book_reviews: updated });
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <Textarea
                        value={review.quote}
                        onChange={(e) => {
                          const updated = [...formData.book_reviews];
                          updated[idx] = { ...updated[idx], quote: e.target.value };
                          setFormData({ ...formData, book_reviews: updated });
                        }}
                        placeholder="What the reader said..."
                        rows={3}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={review.reviewer}
                          onChange={(e) => {
                            const updated = [...formData.book_reviews];
                            updated[idx] = { ...updated[idx], reviewer: e.target.value };
                            setFormData({ ...formData, book_reviews: updated });
                          }}
                          placeholder="Reviewer name"
                        />
                        <Input
                          value={review.reviewer_title || ""}
                          onChange={(e) => {
                            const updated = [...formData.book_reviews];
                            updated[idx] = { ...updated[idx], reviewer_title: e.target.value };
                            setFormData({ ...formData, book_reviews: updated });
                          }}
                          placeholder="Title / descriptor (optional)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Physical Product / Shipping Toggle */}
            <div className="border border-[#E4D9C4] rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_shipping || false}
                  onChange={(e) => setFormData({ ...formData, requires_shipping: e.target.checked })}
                  className="w-4 h-4 accent-[#1E3A32]"
                />
                <div>
                  <span className="font-medium text-[#1E3A32]">Physical Product — Requires Shipping</span>
                  <p className="text-xs text-[#2B2725]/60 mt-0.5">
                    Turn this on for paperback books or other physical items. Checkout will collect a shipping address and charge shipping fees.
                  </p>
                </div>
              </label>
            </div>

            {/* Pricing */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Pricing Tier <span className="text-xs font-normal text-[#2B2725]/50">(internal classification)</span></Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foundation">Tier 1: Foundation</SelectItem>
                    <SelectItem value="mid_level">Tier 2: Mid-Level</SelectItem>
                    <SelectItem value="high_touch">Tier 3: High-Touch</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pricing Type * <span className="text-xs font-normal text-[#2B2725]/50">(how it's charged)</span></Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time Purchase</SelectItem>
                    <SelectItem value="subscription">Subscription (recurring)</SelectItem>
                    <SelectItem value="payment_plan">Payment Plan (installments)</SelectItem>
                    <SelectItem value="consultation">Consultation (free/booking)</SelectItem>
                    <SelectItem value="bundle">Bundle (multiple products)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Price (USD) <span className="text-xs font-normal text-[#2B2725]/50">(enter the full dollar amount)</span></Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="9.00"
                  step="0.01"
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  e.g. enter 9 for $9.00, or 997 for $997.00
                </p>
              </div>

              {formData.type === "subscription" && (
                <div>
                  <Label>Billing Interval</Label>
                  <Select
                    value={formData.billing_interval}
                    onValueChange={(value) => setFormData({ ...formData, billing_interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Payment Plans */}
            <div className="border border-[#E4D9C4] rounded-lg p-4">
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePaymentPlans}
                    onChange={(e) => {
                      setEnablePaymentPlans(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, payment_plan_options: [] });
                      } else {
                        setFormData({ ...formData, payment_plan_options: [
                          { name: "Pay in Full", months: 1, monthly_price: parseInt(formData.price) || 0 },
                          { name: "3 Monthly Payments", months: 3, monthly_price: Math.round((parseInt(formData.price) || 0) / 3) }
                        ]});
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-[#1E3A32]">Offer Payment Plans</span>
                </label>
              </div>

              {enablePaymentPlans && (
                <div className="space-y-3">
                  {formData.payment_plan_options.map((plan, idx) => (
                    <div key={idx} className="bg-[#F9F5EF] p-3 rounded space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Plan name"
                          value={plan.name}
                          onChange={(e) => {
                            const updated = [...formData.payment_plan_options];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, payment_plan_options: updated });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Months"
                          min="1"
                          max="12"
                          value={plan.months}
                          onChange={(e) => {
                            const updated = [...formData.payment_plan_options];
                            updated[idx].months = parseInt(e.target.value) || 1;
                            setFormData({ ...formData, payment_plan_options: updated });
                          }}
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="Monthly $"
                            value={plan.monthly_price / 100}
                            onChange={(e) => {
                              const updated = [...formData.payment_plan_options];
                              updated[idx].monthly_price = Math.round((parseFloat(e.target.value) || 0) * 100);
                              setFormData({ ...formData, payment_plan_options: updated });
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updated = formData.payment_plan_options.filter((_, i) => i !== idx);
                              setFormData({ ...formData, payment_plan_options: updated });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-[#2B2725]/60">
                        Total: ${((plan.monthly_price * plan.months) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPrice = Math.round((parseInt(formData.price) || 0) / 2);
                      setFormData({
                        ...formData,
                        payment_plan_options: [
                          ...formData.payment_plan_options,
                          { name: `Pay in ${formData.payment_plan_options.length + 1}`, months: formData.payment_plan_options.length + 1, monthly_price: newPrice }
                        ]
                      });
                    }}
                    className="w-full"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Plan Option
                  </Button>
                </div>
              )}
            </div>

            {/* Features */}
            <div>
              <Label>Features</Label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Feature description"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addFeature} className="mt-2">
                <Plus size={14} className="mr-1" />
                Add Feature
              </Button>
            </div>

            {/* Access Control */}
            <div>
              <Label>Related Course (optional)</Label>
              <Select
                value={formData.related_course_id}
                onValueChange={(value) => setFormData({ ...formData, related_course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.related_course_id && (
                <div className="mt-2 p-2 bg-[#1E3A32]/5 border border-[#1E3A32]/20 rounded text-xs">
                  <p className="font-mono text-[#1E3A32]">ID: {formData.related_course_id}</p>
                </div>
              )}
              <p className="text-xs text-[#2B2725]/60 mt-1">
                Link this product to a single course (for simple products)
              </p>
            </div>

            <div>
              <Label>Related Webinar / Live Event (optional)</Label>
              <Select
                value={formData.related_webinar_id || ""}
                onValueChange={(value) => setFormData({ ...formData, related_webinar_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a webinar or live event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {products.filter(p => p.product_subtype === 'webinar').map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.related_webinar_id && (
                <div className="mt-2 p-2 bg-[#1E3A32]/5 border border-[#1E3A32]/20 rounded text-xs">
                  <p className="font-mono text-[#1E3A32]">ID: {formData.related_webinar_id}</p>
                </div>
              )}
              <p className="text-xs text-[#2B2725]/60 mt-1">
                Link to a webinar or live event
              </p>
            </div>

            <div>
              <Label>Add Multiple Courses (for bundles)</Label>
              <Textarea
                value={formData.access_grants.map(id => {
                  const course = courses.find(c => c.id === id);
                  return course ? `${course.title} (${id})` : id;
                }).join("\n")}
                onChange={(e) => {
                  // Extract IDs from either "Title (ID)" format or raw IDs
                  const grants = e.target.value.split("\n").filter(line => line.trim()).map(line => {
                    const match = line.match(/\(([^)]+)\)$/);
                    return match ? match[1] : line.trim();
                  });
                  setFormData({ ...formData, access_grants: grants });
                }}
                placeholder="Type course title or paste ID..."
                rows={4}
              />
              <p className="text-xs text-[#2B2725]/60 mt-1">
                Add course IDs this product unlocks (one per line). Used for bundles or multi-course products. You can type the course title and it will auto-populate the ID.
              </p>
              {formData.access_grants.length > 0 && (
                <div className="mt-2 p-2 bg-[#F9F5EF] rounded space-y-1">
                  {formData.access_grants.map((id, idx) => {
                    const course = courses.find(c => c.id === id);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-[#1E3A32]">{course?.title || 'Unknown Course'}</span>
                        <code className="font-mono text-[#2B2725]/60">{id}</code>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Included Resources */}
            {editingProduct && (
              <ProductResourcesPanel stripeProductId={editingProduct.stripe_product_id} />
            )}

            {/* Display Settings */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>UI Group</Label>
                <Select
                  value={formData.ui_group}
                  onValueChange={(value) => setFormData({ ...formData, ui_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero (Featured)</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => {
                   const newOrder = parseInt(e.target.value) || 0;
                   setFormData({ ...formData, display_order: newOrder });
                   // Auto-save immediately if editing existing product
                   if (editingProduct) {
                     updateMutation.mutate({ id: editingProduct.id, data: { display_order: newOrder } });
                   }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              {editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Code Dialog */}
      <GiftDialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <GiftDialogContent className="max-w-lg">
          <GiftDialogHeader>
            <GiftDialogTitle className="font-serif text-xl text-[#1E3A32]">
              Generate Gift Code — {giftProduct?.name}
            </GiftDialogTitle>
          </GiftDialogHeader>
          {giftProduct && (
            <GiftCodeGenerator
              productId={giftProduct.id}
              productType={giftProduct.type}
              onCodeGenerated={() => {}}
            />
          )}
        </GiftDialogContent>
      </GiftDialog>

      {/* Bundle Creator Dialog */}
      <BundleCreator
        open={bundleDialogOpen}
        onClose={() => {
          setBundleDialogOpen(false);
          setEditingBundle(null);
        }}
        existingBundle={editingBundle}
      />
    </div>
  );
}