import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Upload, FileText, Link as LinkIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import AudiobookPicker from "./AudiobookPicker";

export default function PurchaseOptionsEditor({ options = [], onChange, currentProductId, parentProductName }) {
  const queryClient = useQueryClient();
  const [creatingVariant, setCreatingVariant] = useState(null); // index of option being created

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date"),
  });

  const { data: allResources = [] } = useQuery({
    queryKey: ["resources-for-variants"],
    queryFn: () => base44.entities.Resource.filter({ status: "published" }),
  });

  const availableProducts = allProducts.filter(p => p.id !== currentProductId && p.product_subtype === 'book');

  const handleAddOption = () => {
    const newOption = {
      type: "digital",
      product_id: "",
      enabled: true,
      display_label: "",
      badge: "",
      sort_order: (options?.length || 0),
      // Inline creation fields (not saved to DB — used only in this editor)
      _inline: true,
      _variant_name: "",
      _variant_price: "",
    };
    onChange([...(options || []), newOption]);
  };

  const handleUpdateOption = (index, field, value) => {
    const updated = [...(options || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemoveOption = (index) => {
    const updated = options.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSwitchToExisting = (index) => {
    const updated = [...(options || [])];
    updated[index] = { ...updated[index], _inline: false, _variant_name: "", _variant_price: "" };
    onChange(updated);
  };

  const handleSwitchToInline = (index) => {
    const updated = [...(options || [])];
    updated[index] = { ...updated[index], _inline: true, product_id: "" };
    onChange(updated);
  };

  const handleCreateVariantProduct = async (index) => {
    const option = options[index];
    const variantName = option._variant_name?.trim();
    const variantPrice = parseFloat(option._variant_price);

    if (!variantName) {
      toast.error("Please enter a name for the variant");
      return;
    }
    if (!variantPrice || variantPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setCreatingVariant(index);
    try {
      const priceInCents = Math.round(variantPrice * 100);
      const key = variantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const slug = key;

      // Create the variant product
      const created = await base44.entities.Product.create({
        key,
        slug,
        name: variantName,
        type: "one_time",
        product_subtype: "book",
        category: "foundation",
        price: priceInCents,
        currency: "usd",
        status: "published",
        ui_group: "hidden",
        template_choice: "minimal",
      });

      // Sync to Stripe
      try {
        const syncResult = await base44.functions.invoke('syncProductStripe', {
          product_id: created.id,
          key,
          name: variantName,
          description: `Variant of ${parentProductName || 'book'}`,
          price: priceInCents,
          currency: "usd",
          billing_interval: "one_time",
          type: "one_time",
        });

        if (syncResult.data?.success) {
          await base44.entities.Product.update(created.id, {
            stripe_product_id: syncResult.data.stripe_product_id,
            stripe_price_id: syncResult.data.stripe_price_id,
            stripe_price_ids: syncResult.data.stripe_price_ids,
          });
        }
      } catch (stripeErr) {
        console.warn("Stripe sync failed for variant, can be retried:", stripeErr);
      }

      // Update the option to point to the new product
      const updated = [...(options || [])];
      updated[index] = {
        ...updated[index],
        product_id: created.id,
        _inline: false,
        _variant_name: "",
        _variant_price: "",
      };
      onChange(updated);

      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Created "${variantName}" and synced with Stripe`);
    } catch (error) {
      toast.error(`Failed to create variant: ${error.message}`);
    } finally {
      setCreatingVariant(null);
    }
  };

  const handleCreateBundleProduct = async (index) => {
    const option = options[index];
    const bundledIds = Array.isArray(option.product_id) ? option.product_id : [];
    const bundlePrice = option.bundle_price;
    const label = option.display_label?.trim();

    if (bundledIds.length < 2) {
      toast.error("Please select at least 2 products for the bundle");
      return;
    }
    if (!bundlePrice || bundlePrice <= 0) {
      toast.error("Please set a bundle price");
      return;
    }

    setCreatingVariant(index);
    try {
      const bundleName = label || `${parentProductName || 'Book'} Bundle`;
      const key = bundleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

      // Create a new hidden bundle product
      const created = await base44.entities.Product.create({
        key,
        slug: key,
        name: bundleName,
        type: "bundle",
        is_bundle: true,
        bundled_product_ids: bundledIds,
        product_subtype: "book",
        category: "foundation",
        price: bundlePrice,
        currency: "usd",
        status: "published",
        ui_group: "hidden",
        template_choice: "minimal",
      });

      // Sync to Stripe
      try {
        const syncResult = await base44.functions.invoke('syncProductStripe', {
          product_id: created.id,
          key,
          name: bundleName,
          description: `Bundle variant of ${parentProductName || 'book'}`,
          price: bundlePrice,
          currency: "usd",
          billing_interval: "one_time",
          type: "bundle",
        });

        if (syncResult.data?.success) {
          await base44.entities.Product.update(created.id, {
            stripe_product_id: syncResult.data.stripe_product_id,
            stripe_price_id: syncResult.data.stripe_price_id,
            stripe_price_ids: syncResult.data.stripe_price_ids,
          });
        }
      } catch (stripeErr) {
        console.warn("Stripe sync failed for bundle variant, can be retried:", stripeErr);
      }

      // Update the option: store the new bundle product ID, keep bundled IDs in product_id array
      const updated = [...(options || [])];
      updated[index] = {
        ...updated[index],
        bundle_product_id: created.id,
      };
      onChange(updated);

      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Created bundle product "${bundleName}" and synced with Stripe`);
    } catch (error) {
      toast.error(`Failed to create bundle product: ${error.message}`);
    } finally {
      setCreatingVariant(null);
    }
  };

  const getProductName = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getProductPrice = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    return product?.price ? `$${(product.price / 100).toFixed(2)}` : "";
  };

  return (
    <div className="space-y-4 p-4 bg-[#1E3A32]/5 border border-[#1E3A32]/20 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold text-[#1E3A32]">Purchase Options (Variants)</Label>
          <p className="text-xs text-[#2B2725]/60 mt-1">Add Digital, Paperback, Bundle, or other purchase formats for this book</p>
          <p className="text-xs text-[#D8B46B]/80 mt-1 italic">
            💡 Create one Product per book. Add variants here for Digital, Paperback, and Bundle options. Link each digital variant to a Resource for delivery.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleAddOption}
          className="bg-[#1E3A32] hover:bg-[#2B2725]"
        >
          <Plus size={14} className="mr-1" />
          Add Variant
        </Button>
      </div>

      {(!options || options.length === 0) && (
        <div className="text-center py-8 bg-white rounded border border-[#E4D9C4] border-dashed">
          <p className="text-sm text-[#2B2725]/60 mb-3">No purchase options configured yet</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddOption}
          >
            <Plus size={14} className="mr-1" />
            Add First Variant
          </Button>
        </div>
      )}

      {options && options.map((option, index) => (
        <div key={index} className="bg-white border border-[#E4D9C4] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#1E3A32]">Variant {index + 1}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleRemoveOption(index)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type *</Label>
              <Select
                value={option.type || "digital"}
                onValueChange={(value) => handleUpdateOption(index, "type", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">📱 Digital</SelectItem>
                  <SelectItem value="physical">📦 Paperback / Physical</SelectItem>
                  <SelectItem value="audiobook">🎧 Audiobook</SelectItem>
                  <SelectItem value="bundle">🎁 Bundle</SelectItem>
                  <SelectItem value="custom">✨ Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Selection / Creation */}
            <div className="md:col-span-2">
              {option.type === 'bundle' ? (
                <BundleProductSelector
                  option={option}
                  index={index}
                  availableProducts={availableProducts}
                  handleUpdateOption={handleUpdateOption}
                  getProductName={getProductName}
                />
              ) : option.product_id && !option._inline ? (
                // Already linked to an existing product — show it with inline price edit
                <div>
                  <Label className="text-xs">Linked Product</Label>
                  <div className="mt-1 p-3 bg-[#F9F5EF] rounded border border-[#E4D9C4]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1E3A32]">{getProductName(option.product_id)}</p>
                        <p className="text-xs text-[#2B2725]/60">{getProductPrice(option.product_id)}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateOption(index, "product_id", "")}
                        className="text-xs"
                      >
                        Change
                      </Button>
                    </div>
                    <InlinePriceEditor
                      productId={option.product_id}
                      allProducts={allProducts}
                      queryClient={queryClient}
                    />
                  </div>
                </div>
              ) : (
                // Choose: create new or select existing
                <div>
                  <Label className="text-xs">Product *</Label>
                  <div className="mt-1 flex gap-2 mb-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={option._inline !== false ? "default" : "outline"}
                      onClick={() => handleSwitchToInline(index)}
                      className={option._inline !== false ? "bg-[#1E3A32] hover:bg-[#2B2725]" : ""}
                    >
                      Create New
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={option._inline === false ? "default" : "outline"}
                      onClick={() => handleSwitchToExisting(index)}
                      className={option._inline === false ? "bg-[#1E3A32] hover:bg-[#2B2725]" : ""}
                    >
                      Select Existing
                    </Button>
                  </div>

                  {option._inline !== false ? (
                    // Inline creation form
                    <div className="p-3 bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded space-y-3">
                      <div>
                        <Label className="text-xs">Variant Name *</Label>
                        <Input
                          size="sm"
                          value={option._variant_name || ""}
                          onChange={(e) => handleUpdateOption(index, "_variant_name", e.target.value)}
                          placeholder={`e.g., ${parentProductName || 'Book Title'} - ${option.type === 'digital' ? 'Digital' : option.type === 'physical' ? 'Paperback' : option.type === 'audiobook' ? 'Audiobook' : 'Edition'}`}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price (USD) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          size="sm"
                          value={option._variant_price || ""}
                          onChange={(e) => handleUpdateOption(index, "_variant_price", e.target.value)}
                          placeholder="e.g., 16.99"
                          className="h-9 text-sm"
                        />
                        {option._variant_price && (
                          <p className="text-xs text-[#2B2725]/60 mt-1">
                            Displays as ${parseFloat(option._variant_price || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCreateVariantProduct(index)}
                        disabled={creatingVariant === index}
                        className="bg-[#D8B46B] hover:bg-[#C9A55C] text-[#1E3A32] w-full"
                      >
                        {creatingVariant === index ? (
                          <>
                            <Loader2 size={14} className="mr-1 animate-spin" />
                            Creating & Syncing...
                          </>
                        ) : (
                          <>
                            <Plus size={14} className="mr-1" />
                            Create Variant Product
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-[#2B2725]/50">
                        This creates a new product record and syncs it with Stripe automatically.
                      </p>
                    </div>
                  ) : (
                    // Select existing product
                    <Select
                      value={option.product_id || ""}
                      onValueChange={(value) => handleUpdateOption(index, "product_id", value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select an existing product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (${(product.price / 100).toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          </div>

          {option.type === 'bundle' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Bundle Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  size="sm"
                  value={option.bundle_price != null && option.bundle_price !== "" ? (option.bundle_price / 100).toFixed(2) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateOption(index, "bundle_price", val ? Math.round(parseFloat(val) * 100) : "");
                  }}
                  placeholder="e.g., 29.99"
                  className="h-9 text-sm"
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  {option.bundle_price ? `Displays as $${(option.bundle_price / 100).toFixed(2)}` : 'Set a custom price for this bundle'}
                </p>
              </div>

              {/* Create Bundle Product + Stripe sync */}
              {option.bundle_product_id ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium">✓ Bundle product created & synced with Stripe</p>
                  <p className="text-xs text-green-600 mt-1">Product ID: {option.bundle_product_id}</p>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCreateBundleProduct(index)}
                  disabled={creatingVariant === index || !option.bundle_price || !(Array.isArray(option.product_id) && option.product_id.length >= 2)}
                  className="bg-[#D8B46B] hover:bg-[#C9A55C] text-[#1E3A32] w-full"
                >
                  {creatingVariant === index ? (
                    <>
                      <Loader2 size={14} className="mr-1 animate-spin" />
                      Creating Bundle Product & Syncing...
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="mr-1" />
                      Create Bundle Product & Sync to Stripe
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-[#2B2725]/50">
                This creates a new product record for this bundle at the set price and syncs it with Stripe.
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <Label className="text-xs">Display Label</Label>
            <Input
              size="sm"
              value={option.display_label || ""}
              onChange={(e) => handleUpdateOption(index, "display_label", e.target.value)}
              placeholder={option.type === 'bundle' ? "e.g., 'Complete Bundle', 'The Full Collection'" : "e.g., 'Digital Book', 'Paperback'"}
              className="h-9 text-sm"
            />
            <p className="text-xs text-[#2B2725]/60 mt-1">How this option appears to customers</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Badge (Optional)</Label>
              <Input
                size="sm"
                value={option.badge || ""}
                onChange={(e) => handleUpdateOption(index, "badge", e.target.value)}
                placeholder="e.g., 'Best Value', 'Most Popular'"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Display Order</Label>
              <Input
                type="number"
                size="sm"
                value={option.sort_order ?? index}
                onChange={(e) => handleUpdateOption(index, "sort_order", parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Digital Resource Attachment — show for all digital variants, even during inline creation */}
          {option.type === 'digital' && (
            <DigitalResourcePicker
              option={option}
              index={index}
              allResources={allResources}
              handleUpdateOption={handleUpdateOption}
              queryClient={queryClient}
            />
          )}

          {/* Audiobook Picker — link to existing Audiobook entity */}
          {option.type === 'audiobook' && (
            <AudiobookPicker
              audiobookId={option.audiobook_id}
              onChange={(id) => handleUpdateOption(index, 'audiobook_id', id)}
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={option.enabled !== false}
              onChange={(e) => handleUpdateOption(index, "enabled", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[#1E3A32]">Enabled (show to customers)</span>
          </label>
        </div>
      ))}
    </div>
  );
}

function DigitalResourcePicker({ option, index, allResources, handleUpdateOption, queryClient }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const linkedResource = option.digital_resource_id
    ? allResources.find(r => r.id === option.digital_resource_id)
    : null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const resource = await base44.entities.Resource.create({
        title: file.name.replace(/\.[^.]+$/, ''),
        resource_type: file.type.includes('pdf') ? 'pdf' : file.type.includes('audio') ? 'audio' : file.type.includes('video') ? 'video' : 'link',
        file_url,
        file_size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
        access_level: 'product_gated',
        status: 'published',
        category: 'Other',
      });
      handleUpdateOption(index, 'digital_resource_id', resource.id);
      queryClient.invalidateQueries({ queryKey: ['resources-for-variants'] });
      toast.success(`Uploaded and linked "${resource.title}"`);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (linkedResource) {
    return (
      <div className="mt-2 border border-[#D8B46B]/30 bg-[#D8B46B]/5 rounded p-3">
        <Label className="text-xs">Digital Resource</Label>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-[#D8B46B] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1E3A32] truncate">{linkedResource.title}</p>
              <p className="text-xs text-[#2B2725]/60">{linkedResource.resource_type} {linkedResource.file_size ? `• ${linkedResource.file_size}` : ''}</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateOption(index, 'digital_resource_id', '')}
            className="text-xs flex-shrink-0"
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 border border-[#E4D9C4] bg-[#F9F5EF] rounded p-3 space-y-3">
      <Label className="text-xs">Attach Digital Resource</Label>
      <p className="text-xs text-[#2B2725]/50">Upload a file or select an existing resource that buyers will receive.</p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? (
            <><Loader2 size={14} className="mr-1 animate-spin" /> Uploading...</>
          ) : (
            <><Upload size={14} className="mr-1" /> Upload File</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.epub,.mobi,.mp3,.mp4,.zip,.docx"
        />
      </div>
      {allResources.length > 0 && (
        <div>
          <Label className="text-xs mb-1 block">Or select existing resource</Label>
          <Select
            value={option.digital_resource_id || ''}
            onValueChange={(v) => handleUpdateOption(index, 'digital_resource_id', v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose a resource..." />
            </SelectTrigger>
            <SelectContent>
              {allResources.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.title} ({r.resource_type}{r.file_size ? ` • ${r.file_size}` : ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function InlinePriceEditor({ productId, allProducts, queryClient }) {
  const product = allProducts.find(p => p.id === productId);
  const [editing, setEditing] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const handleSave = async () => {
    const priceVal = parseFloat(newPrice);
    if (!priceVal || priceVal <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    setSaving(true);
    try {
      const priceInCents = Math.round(priceVal * 100);
      await base44.entities.Product.update(productId, { price: priceInCents });
      // Re-sync to Stripe if product has stripe ID
      if (product.stripe_product_id) {
        try {
          await base44.functions.invoke('syncProductStripe', {
            product_id: productId,
            key: product.key,
            name: product.name,
            description: product.short_description || `Variant of ${product.name}`,
            price: priceInCents,
            currency: product.currency || "usd",
            billing_interval: "one_time",
            type: product.type || "one_time",
          });
        } catch (stripeErr) {
          console.warn("Stripe re-sync after price change:", stripeErr);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Price updated to $${priceVal.toFixed(2)}`);
      setEditing(false);
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setNewPrice((product.price / 100).toFixed(2));
          setEditing(true);
        }}
        className="mt-2 text-xs text-[#D8B46B] hover:text-[#C9A55C] underline"
      >
        Edit price
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-[#2B2725]/60">$</span>
      <Input
        type="number"
        step="0.01"
        value={newPrice}
        onChange={(e) => setNewPrice(e.target.value)}
        className="h-8 text-sm w-28"
        autoFocus
      />
      <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="h-8 bg-[#1E3A32] hover:bg-[#2B2725] text-xs px-3">
        {saving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 text-xs px-2">
        Cancel
      </Button>
    </div>
  );
}

function BundleProductSelector({ option, index, availableProducts, handleUpdateOption, getProductName }) {
  return (
    <div>
      <Label className="text-xs">Related Product(s) *</Label>
      <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border border-[#E4D9C4] rounded p-3 bg-white">
        {availableProducts.length === 0 ? (
          <p className="text-xs text-[#2B2725]/60">No other book products available</p>
        ) : (
          availableProducts.map((product) => {
            const productIds = Array.isArray(option.product_id) ? option.product_id : (option.product_id ? [option.product_id] : []);
            const isSelected = productIds.includes(product.id);
            return (
              <label key={product.id} className="flex items-center gap-2 cursor-pointer hover:bg-[#F9F5EF] p-2 rounded">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    let newIds = Array.isArray(option.product_id) ? [...option.product_id] : [];
                    if (e.target.checked) {
                      newIds.push(product.id);
                    } else {
                      newIds = newIds.filter(id => id !== product.id);
                    }
                    handleUpdateOption(index, "product_id", newIds);
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1E3A32] truncate">{product.name}</p>
                  <p className="text-xs text-[#2B2725]/60">${(product.price / 100).toFixed(2)}</p>
                </div>
              </label>
            );
          })
        )}
      </div>
      {option.product_id && Array.isArray(option.product_id) && option.product_id.length > 0 && (
        <div className="mt-2 space-y-1">
          {option.product_id.map((productId) => (
            <p key={productId} className="text-xs text-[#2B2725]/60">
              ✓ {getProductName(productId)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}