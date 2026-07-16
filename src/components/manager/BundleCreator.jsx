import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ChevronRight, ChevronLeft, Check, DollarSign, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";

export default function BundleCreator({ open, onClose, existingBundle = null }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [enablePaymentPlans, setEnablePaymentPlans] = useState(
    !!(existingBundle?.payment_plan_options?.length)
  );

  // Reset step and form when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setEnablePaymentPlans(!!(existingBundle?.payment_plan_options?.length));
      if (existingBundle) {
        setBundleData({
          key: existingBundle.key || "",
          slug: existingBundle.slug || "",
          name: existingBundle.name || "",
          tagline: existingBundle.tagline || "",
          short_description: existingBundle.short_description || "",
          long_description: existingBundle.long_description || "",
          type: existingBundle.type || "bundle",
          category: existingBundle.category || "foundation",
          price: existingBundle.price ? (existingBundle.price / 100).toString() : "",
          currency: "usd",
          billing_interval: existingBundle.billing_interval || "one_time",
          features: existingBundle.features || [""],
          icon: existingBundle.icon || "Package",
          color: existingBundle.color || "#1E3A32",
          status: existingBundle.status || "draft",
          ui_group: existingBundle.ui_group || "standard",
          display_order: existingBundle.display_order || 0,
          template_choice: existingBundle.template_choice || "detailed",
          is_bundle: true,
          bundled_product_ids: existingBundle.bundled_product_ids || [],
          access_grants: existingBundle.access_grants || [],
          payment_plan_options: existingBundle.payment_plan_options || [],
          show_on_pages: existingBundle.show_on_pages || ["programs", "buy_programs"],
        });
      } else {
        setBundleData({
          key: "", slug: "", name: "", tagline: "", short_description: "",
          long_description: "", type: "bundle", category: "foundation", price: "",
          currency: "usd", billing_interval: "one_time", features: [""], icon: "Package",
          color: "#1E3A32", status: "draft", ui_group: "standard", display_order: 0,
          template_choice: "detailed", is_bundle: true, bundled_product_ids: [], access_grants: [],
          payment_plan_options: [], show_on_pages: ["programs", "buy_programs"],
        });
      }
    }
  }, [open, existingBundle]);
  const [searchTerm, setSearchTerm] = useState("");

  const [bundleData, setBundleData] = useState({
    key: existingBundle?.key || "",
    slug: existingBundle?.slug || "",
    name: existingBundle?.name || "",
    tagline: existingBundle?.tagline || "",
    short_description: existingBundle?.short_description || "",
    long_description: existingBundle?.long_description || "",
    type: existingBundle?.type || "bundle",
    category: existingBundle?.category || "foundation",
    price: existingBundle?.price ? (existingBundle.price / 100).toString() : "",
    currency: "usd",
    billing_interval: existingBundle?.billing_interval || "one_time",
    features: existingBundle?.features || [""],
    icon: existingBundle?.icon || "Package",
    color: existingBundle?.color || "#1E3A32",
    status: existingBundle?.status || "draft",
    ui_group: existingBundle?.ui_group || "standard",
    display_order: existingBundle?.display_order || 0,
    template_choice: existingBundle?.template_choice || "detailed",
    is_bundle: true,
    bundled_product_ids: existingBundle?.bundled_product_ids || [],
    access_grants: existingBundle?.access_grants || [],
    payment_plan_options: existingBundle?.payment_plan_options || [],
    show_on_pages: existingBundle?.show_on_pages || ["programs", "buy_programs"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date"),
  });

  // Filter out bundles from selection and current bundle if editing
  const availableProducts = products.filter(p => 
    !p.is_bundle && 
    (!existingBundle || p.id !== existingBundle.id)
  );

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProducts = products.filter(p => bundleData.bundled_product_ids.includes(p.id));
  const totalOriginalPrice = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const bundlePrice = bundleData.price ? parseFloat(bundleData.price) * 100 : 0;
  const savings = totalOriginalPrice - bundlePrice;
  const savingsPercent = totalOriginalPrice > 0 ? ((savings / totalOriginalPrice) * 100).toFixed(0) : 0;

  const createBundleMutation = useMutation({
    mutationFn: async (data) => {
      const priceInCents = data.price ? parseInt(parseFloat(data.price) * 100) : 0;
      // Strip read-only built-in fields that the API rejects on update
      const { id, created_date, created_by, updated_date, ...writableFields } = data;
      const dataToSave = {
        ...writableFields,
        price: priceInCents,
        features: (data.features || []).filter(f => f.trim() !== ""),
      };

      let savedId;
      if (existingBundle) {
        await base44.entities.Product.update(existingBundle.id, dataToSave);
        savedId = existingBundle.id;
      } else {
        const created = await base44.entities.Product.create(dataToSave);
        savedId = created.id;
      }

      // Sync with Stripe and save back the IDs
      const syncResult = await base44.functions.invoke('syncProductStripe', {
        product_id: savedId,
        key: dataToSave.key,
        name: dataToSave.name,
        description: dataToSave.short_description,
        price: priceInCents,
        currency: dataToSave.currency,
        billing_interval: dataToSave.billing_interval,
        payment_plan_options: dataToSave.payment_plan_options,
        type: "bundle",
      });

      if (syncResult.data?.success) {
        await base44.entities.Product.update(savedId, {
          stripe_product_id: syncResult.data.stripe_product_id,
          stripe_price_id: syncResult.data.stripe_price_id,
          stripe_price_ids: syncResult.data.stripe_price_ids,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(existingBundle ? "Bundle updated!" : "Bundle created successfully!");
      onClose();
      setStep(1);
    },
    onError: (error) => {
      toast.error(`Failed to save bundle: ${error.message}`);
    },
  });

  const toggleProductSelection = (productId) => {
    const isSelected = bundleData.bundled_product_ids.includes(productId);
    const newSelection = isSelected
      ? bundleData.bundled_product_ids.filter(id => id !== productId)
      : [...bundleData.bundled_product_ids, productId];

    // Auto-populate access_grants with course IDs from selected products
    const accessGrants = [];
    newSelection.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product?.related_course_id) {
        accessGrants.push(product.related_course_id);
      }
      if (product?.access_grants?.length > 0) {
        accessGrants.push(...product.access_grants);
      }
    });

    setBundleData({
      ...bundleData,
      bundled_product_ids: newSelection,
      access_grants: [...new Set(accessGrants)], // Remove duplicates
    });
  };

  const addFeature = () => {
    setBundleData({ ...bundleData, features: [...bundleData.features, ""] });
  };

  const updateFeature = (index, value) => {
    const updated = [...bundleData.features];
    updated[index] = value;
    setBundleData({ ...bundleData, features: updated });
  };

  const removeFeature = (index) => {
    const updated = bundleData.features.filter((_, i) => i !== index);
    setBundleData({ ...bundleData, features: updated });
  };

  const handleNext = () => {
    if (step === 1 && (!bundleData.name || !bundleData.key)) {
      toast.error("Please fill in bundle name and key");
      return;
    }
    if (step === 2 && bundleData.bundled_product_ids.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    if (step === 3 && !bundleData.price) {
      toast.error("Please set a bundle price");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    createBundleMutation.mutate(bundleData);
  };

  const steps = [
    { number: 1, title: "Bundle Details", icon: Package },
    { number: 2, title: "Select Products", icon: Package },
    { number: 3, title: "Set Pricing", icon: DollarSign },
    { number: 4, title: "Review & Publish", icon: Check },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#1E3A32]">
            {existingBundle ? "Edit Bundle" : "Create Product Bundle"}
          </DialogTitle>
          <p className="text-sm text-[#2B2725]/60">
            Bundle multiple programs together with custom pricing
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 mt-4">
          {steps.map((s, idx) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= s.number
                      ? "bg-[#1E3A32] text-white"
                      : "bg-[#E4D9C4] text-[#2B2725]/40"
                  }`}
                >
                  {step > s.number ? <Check size={20} /> : s.number}
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-medium ${step >= s.number ? "text-[#1E3A32]" : "text-[#2B2725]/40"}`}>
                    {s.title}
                  </p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-4 ${step > s.number ? "bg-[#1E3A32]" : "bg-[#E4D9C4]"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Bundle Name *</Label>
                  <Input
                    value={bundleData.name}
                    onChange={(e) => setBundleData({ ...bundleData, name: e.target.value })}
                    placeholder="The Complete Mind Styling Suite"
                  />
                </div>
                <div>
                  <Label>Bundle Key *</Label>
                  <Input
                    value={bundleData.key}
                    onChange={(e) => {
                      const key = e.target.value;
                      setBundleData({
                        ...bundleData,
                        key,
                        slug: bundleData.slug || key.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      });
                    }}
                    placeholder="complete-suite"
                  />
                </div>
              </div>

              <div>
                <Label>Tagline</Label>
                <Input
                  value={bundleData.tagline}
                  onChange={(e) => setBundleData({ ...bundleData, tagline: e.target.value })}
                  placeholder="Everything you need for transformation"
                />
              </div>

              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={bundleData.short_description}
                  onChange={(e) => setBundleData({ ...bundleData, short_description: e.target.value })}
                  placeholder="A brief description for product cards..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Long Description</Label>
                <ReactQuill
                  value={bundleData.long_description}
                  onChange={(value) => setBundleData({ ...bundleData, long_description: value })}
                  className="bg-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={bundleData.category}
                    onValueChange={(value) => setBundleData({ ...bundleData, category: value })}
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
                  <Label>URL Slug</Label>
                  <Input
                    value={bundleData.slug}
                    onChange={(e) => setBundleData({ ...bundleData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="complete-suite"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-2">Select Programs to Include</h3>
                <p className="text-sm text-[#2B2725]/60 mb-4">
                  Choose the products/programs that will be part of this bundle
                </p>

                {/* Search */}
                <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>

                {/* Product Selection */}
                <div className="border border-[#E4D9C4] rounded-lg max-h-[400px] overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start gap-4 p-4 border-b border-[#E4D9C4] last:border-0 hover:bg-[#F9F5EF] transition-colors cursor-pointer"
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <Checkbox
                        checked={bundleData.bundled_product_ids.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-[#1E3A32]">{product.name}</h4>
                        {product.tagline && (
                          <p className="text-sm text-[#2B2725]/60">{product.tagline}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-[#D8B46B] font-medium">
                            ${((product.price || 0) / 100).toFixed(2)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-[#F9F5EF] text-[#2B2725]/70 rounded">
                            {product.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Summary */}
                {bundleData.bundled_product_ids.length > 0 && (
                  <div className="mt-6 p-4 bg-[#F9F5EF] rounded-lg">
                    <h4 className="font-medium text-[#1E3A32] mb-2">
                      Selected: {bundleData.bundled_product_ids.length} product(s)
                    </h4>
                    <p className="text-sm text-[#2B2725]/70">
                      Total original value: <span className="font-medium">${(totalOriginalPrice / 100).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-2">Set Your Bundle Price</h3>
                <p className="text-sm text-[#2B2725]/60 mb-6">
                  The total value of selected products is ${(totalOriginalPrice / 100).toFixed(2)}. Set your custom bundle price below.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Bundle Price (USD) *</Label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
                      <Input
                        type="number"
                        value={bundleData.price}
                        onChange={(e) => setBundleData({ ...bundleData, price: e.target.value })}
                        placeholder="1495.00"
                        step="0.01"
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Billing Type</Label>
                    <Select
                      value={bundleData.billing_interval}
                      onValueChange={(value) => setBundleData({ ...bundleData, billing_interval: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-Time Payment</SelectItem>
                        <SelectItem value="monthly">Monthly Subscription</SelectItem>
                        <SelectItem value="yearly">Yearly Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Savings Calculator */}
                {bundleData.price && totalOriginalPrice > 0 && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-[#D8B46B]/10 to-[#D8B46B]/5 border-2 border-[#D8B46B] rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#2B2725]/70">Original Value</p>
                        <p className="text-2xl font-serif text-[#2B2725]">
                          ${(totalOriginalPrice / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#2B2725]/70">Bundle Price</p>
                        <p className="text-2xl font-serif text-[#D8B46B]">
                          ${parseFloat(bundleData.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {savings > 0 && (
                      <div className="pt-4 border-t border-[#D8B46B]/30">
                        <p className="text-center">
                          <span className="text-sm text-[#2B2725]/70">Customer saves </span>
                          <span className="text-lg font-medium text-[#1E3A32]">
                            ${(savings / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-[#2B2725]/70"> ({savingsPercent}% discount)</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Plans */}
                <div className="mt-6 border border-[#E4D9C4] rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={enablePaymentPlans}
                      onChange={(e) => {
                        setEnablePaymentPlans(e.target.checked);
                        if (!e.target.checked) {
                          setBundleData({ ...bundleData, payment_plan_options: [] });
                        } else {
                          const fullPrice = parseInt(parseFloat(bundleData.price) * 100) || 0;
                          setBundleData({
                            ...bundleData,
                            payment_plan_options: [
                              { name: "Pay in Full", months: 1, monthly_price: fullPrice },
                              { name: "3 Monthly Payments", months: 3, monthly_price: Math.round(fullPrice / 3) },
                            ],
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-[#1E3A32]">Offer Payment Plans</span>
                  </label>
                  {enablePaymentPlans && (
                    <div className="space-y-3">
                      {bundleData.payment_plan_options.map((plan, idx) => (
                        <div key={idx} className="bg-[#F9F5EF] p-3 rounded space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              className="border border-[#E4D9C4] rounded px-3 py-2 text-sm"
                              placeholder="Plan name"
                              value={plan.name}
                              onChange={(e) => {
                                const updated = [...bundleData.payment_plan_options];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setBundleData({ ...bundleData, payment_plan_options: updated });
                              }}
                            />
                            <input
                              type="number"
                              className="border border-[#E4D9C4] rounded px-3 py-2 text-sm"
                              placeholder="Months"
                              min="1" max="12"
                              value={plan.months}
                              onChange={(e) => {
                                const updated = [...bundleData.payment_plan_options];
                                updated[idx] = { ...updated[idx], months: parseInt(e.target.value) || 1 };
                                setBundleData({ ...bundleData, payment_plan_options: updated });
                              }}
                            />
                            <div className="flex gap-1">
                              <input
                                type="number"
                                className="border border-[#E4D9C4] rounded px-3 py-2 text-sm flex-1"
                                placeholder="Monthly $"
                                value={(plan.monthly_price / 100).toFixed(2)}
                                onChange={(e) => {
                                  const updated = [...bundleData.payment_plan_options];
                                  updated[idx] = { ...updated[idx], monthly_price: Math.round((parseFloat(e.target.value) || 0) * 100) };
                                  setBundleData({ ...bundleData, payment_plan_options: updated });
                                }}
                              />
                              <Button size="sm" variant="outline" onClick={() => {
                                const updated = bundleData.payment_plan_options.filter((_, i) => i !== idx);
                                setBundleData({ ...bundleData, payment_plan_options: updated });
                              }}><Trash2 size={14} /></Button>
                            </div>
                          </div>
                          <p className="text-xs text-[#2B2725]/60">
                            Total: ${((plan.monthly_price * plan.months) / 100).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => {
                        setBundleData({
                          ...bundleData,
                          payment_plan_options: [
                            ...bundleData.payment_plan_options,
                            { name: `Plan ${bundleData.payment_plan_options.length + 1}`, months: bundleData.payment_plan_options.length + 1, monthly_price: 0 }
                          ]
                        });
                      }} className="w-full">
                        <Plus size={14} className="mr-1" /> Add Plan Option
                      </Button>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="mt-6">
                  <Label>Bundle Features/Benefits</Label>
                  <p className="text-xs text-[#2B2725]/60 mb-3">
                    Highlight what makes this bundle special
                  </p>
                  {bundleData.features.map((feature, index) => (
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
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addFeature} className="mt-2">
                    + Add Feature
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-2">Review Your Bundle</h3>
                <p className="text-sm text-[#2B2725]/60 mb-6">
                  Everything looks good? Publish your bundle or save as draft.
                </p>

                <div className="space-y-6">
                  {/* Bundle Summary */}
                  <div className="border border-[#E4D9C4] rounded-lg p-6 bg-white">
                    <h4 className="font-serif text-2xl text-[#1E3A32] mb-2">{bundleData.name}</h4>
                    {bundleData.tagline && (
                      <p className="text-[#2B2725]/70 mb-4">{bundleData.tagline}</p>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl font-serif text-[#D8B46B]">
                        ${parseFloat(bundleData.price).toFixed(2)}
                      </span>
                      {savings > 0 && (
                        <span className="text-sm text-[#A6B7A3]">
                          Save {savingsPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Included Products */}
                  <div>
                    <h4 className="font-medium text-[#1E3A32] mb-3">Included Products ({selectedProducts.length})</h4>
                    <div className="space-y-2">
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-[#F9F5EF] rounded">
                          <span className="text-[#1E3A32]">{product.name}</span>
                          <span className="text-sm text-[#2B2725]/60">
                            ${((product.price || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Page Visibility */}
                  <div className="border border-[#E4D9C4] rounded-lg p-4">
                    <Label className="mb-3 block font-medium text-[#1E3A32]">Show this bundle on:</Label>
                    <p className="text-xs text-[#2B2725]/60 mb-3">Select which public pages this bundle appears on</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "programs", label: "Programs Overview page" },
                        { value: "buy_programs", label: "Buy Programs page" },
                        { value: "courses", label: "Courses & Training page" },
                        { value: "webinars", label: "Webinars page" },
                        { value: "books", label: "Books & Resources page" },
                        { value: "other", label: "Other Programs page" },
                      ].map(({ value, label }) => {
                        const checked = (bundleData.show_on_pages || []).includes(value);
                        return (
                          <label key={value} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#F9F5EF]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const current = bundleData.show_on_pages || [];
                                const updated = checked
                                  ? current.filter(p => p !== value)
                                  : [...current, value];
                                setBundleData({ ...bundleData, show_on_pages: updated });
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-[#2B2725]">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Publish Options */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={bundleData.status}
                        onValueChange={(value) => setBundleData({ ...bundleData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Save as Draft</SelectItem>
                          <SelectItem value="published">Publish Now</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Display Group</Label>
                      <Select
                        value={bundleData.ui_group}
                        onValueChange={(value) => setBundleData({ ...bundleData, ui_group: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hero">Hero (Top Featured)</SelectItem>
                          <SelectItem value="featured">Featured</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={bundleData.display_order}
                        onChange={(e) => setBundleData({ ...bundleData, display_order: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                      <p className="text-xs text-[#2B2725]/60 mt-1">Lower = appears first</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-[#E4D9C4]">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
            disabled={createBundleMutation.isPending}
          >
            <ChevronLeft size={18} className="mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              Next Step
              <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createBundleMutation.isPending}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Check size={18} className="mr-1" />
              {bundleData.status === "published" ? "Publish Bundle" : "Save Draft"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}