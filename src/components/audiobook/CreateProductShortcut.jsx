import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";

export default function CreateProductShortcut({ open, onClose, audiobookTitle, audiobookSlug, onProductCreated }) {
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    const priceInCents = Math.round(parseFloat(price) * 100);
    if (!priceInCents || priceInCents <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    setCreating(true);
    setError(null);

    // 1. Create the Product entity
    const productData = {
      key: `audiobook-${audiobookSlug}`,
      slug: `audiobook-${audiobookSlug}`,
      name: `${audiobookTitle} (Audiobook)`,
      type: "one_time",
      product_subtype: "book",
      category: "foundation",
      price: priceInCents,
      currency: "usd",
      billing_interval: "one_time",
      status: "published",
      active: true,
    };

    const created = await base44.entities.Product.create(productData);

    // 2. Sync to Stripe
    const stripeResult = await base44.functions.invoke("syncProductStripe", {
      product_id: created.id,
      key: productData.key,
      name: productData.name,
      description: `Audiobook: ${audiobookTitle}`,
      price: priceInCents,
      currency: "usd",
      type: "one_time",
    });

    // 3. Update the Product with Stripe IDs
    if (stripeResult.data?.stripe_product_id) {
      await base44.entities.Product.update(created.id, {
        stripe_product_id: stripeResult.data.stripe_product_id,
        stripe_price_id: stripeResult.data.stripe_price_id,
        stripe_price_ids: stripeResult.data.stripe_price_ids,
      });
    }

    setCreating(false);
    onProductCreated(created.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[#1E3A32]">
            Create Product & Sync to Stripe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          <p className="text-sm text-[#2B2725]/60">
            This will create a product called <strong>"{audiobookTitle} (Audiobook)"</strong>, 
            sync it to Stripe, and link it to this audiobook automatically.
          </p>

          <div>
            <Label className="text-xs">Price (USD)</Label>
            <div className="relative mt-1">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
              <Input
                type="number"
                step="0.01"
                min="0.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                className="pl-8"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={creating}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#1E3A32] hover:bg-[#2B2725] gap-2"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating ? "Creating..." : "Create & Sync to Stripe"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}