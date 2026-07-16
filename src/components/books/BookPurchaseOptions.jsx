import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShoppingCart, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "../shop/CartContext";

// Parse product_id which can be: a string ID, a JSON-encoded array string, or an actual array
function parseProductIds(productId) {
  if (!productId) return [];
  if (Array.isArray(productId)) return productId;
  if (typeof productId === 'string' && productId.startsWith('[')) {
    try { return JSON.parse(productId); } catch (e) { return [productId]; }
  }
  return [productId];
}

export default function BookPurchaseOptions({
  product,
  productId,
  ctaLabel = "Buy Now",
  onAddToCart,
  defaultSelected = null,
  quiz = null,
}) {
  const { addItem } = useCart();

  // Fetch the parent product if only productId is provided
  const { data: fetchedProduct } = useQuery({
    queryKey: ["book-product", productId],
    queryFn: async () => {
      if (!productId) return null;
      const prods = await base44.entities.Product.filter({ id: productId });
      return prods[0] || null;
    },
    enabled: !!productId && !product,
  });

  const parentProduct = product || fetchedProduct;

  const [selectedProductId, setSelectedProductId] = useState(defaultSelected);
  const [isAdding, setIsAdding] = useState(false);

  // Load all variant products
  const { data: variantProducts = {} } = useQuery({
    queryKey: ["book-variants", parentProduct?.id],
    queryFn: async () => {
      if (!parentProduct?.id) return {};
      
      if (parentProduct?.purchase_options && parentProduct.purchase_options.length > 0) {
        const variants = {};
        for (const option of parentProduct.purchase_options) {
          const productIds = parseProductIds(option.product_id);
          const allIds = [...productIds];
          if (option.bundle_product_id) allIds.push(option.bundle_product_id);
          for (const pid of allIds) {
            if (!pid) continue;
            const prods = await base44.entities.Product.filter({ id: pid });
            if (prods[0]) {
              variants[pid] = prods[0];
            }
          }
        }
        return variants;
      }
      
      return {};
    },
    enabled: !!parentProduct?.id,
  });

  // Filter enabled options and sort
  const enabledOptions = (parentProduct?.purchase_options || [])
    .filter((opt) => {
      if (opt.enabled === false) return false;
      if (opt.type === 'bundle' && opt.bundle_product_id) {
        return !!variantProducts[opt.bundle_product_id];
      }
      const ids = parseProductIds(opt.product_id);
      if (ids.length > 1) {
        return ids.every(id => variantProducts[id]);
      }
      return ids.length > 0 && variantProducts[ids[0]];
    })
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Auto-select first option if none selected
  useEffect(() => {
    if (!selectedProductId && enabledOptions.length > 0) {
      const firstOpt = enabledOptions[0];
      if (firstOpt.type === 'bundle' && firstOpt.bundle_product_id) {
        setSelectedProductId(firstOpt.bundle_product_id);
      } else {
        const ids = parseProductIds(firstOpt.product_id);
        if (ids[0]) setSelectedProductId(ids[0]);
      }
    }
  }, [enabledOptions.length, selectedProductId]);

  const selectedVariant = selectedProductId ? variantProducts[selectedProductId] : null;

  // Find selected option for display price
  const selectedOption = enabledOptions.find(opt => {
    if (opt.type === 'bundle' && opt.bundle_product_id) return opt.bundle_product_id === selectedProductId;
    const ids = parseProductIds(opt.product_id);
    return ids[0] === selectedProductId;
  });

  const getOptionPrice = (option) => {
    const productIds = (option.type === 'bundle' && option.bundle_product_id)
      ? [option.bundle_product_id]
      : parseProductIds(option.product_id);
    const variant = variantProducts[productIds[0]];
    const rawPrice = (option.type === 'bundle' && option.bundle_price) ? option.bundle_price : variant?.price;
    return rawPrice ? (rawPrice / 100).toFixed(2) : "0.00";
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) return;
    setIsAdding(true);
    try {
      const response = await base44.functions.invoke("createProductCheckout", {
        product_id: selectedVariant.id,
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong starting checkout. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedOption) return;
    addItem({
      id: selectedVariant.id,
      name: selectedOption.display_label || selectedVariant.name,
      price: selectedVariant.price,
      thumbnail: parentProduct?.book_cover_image || parentProduct?.thumbnail,
    });
  };

  return (
    <div className="space-y-4">
      {/* Purchase option radio buttons */}
      <div className="space-y-3">
        {enabledOptions.map((option) => {
          const productIds = (option.type === 'bundle' && option.bundle_product_id)
            ? [option.bundle_product_id]
            : parseProductIds(option.product_id);
          const variant = variantProducts[productIds[0]];
          const price = getOptionPrice(option);
          const comparePrice = variant?.compare_at_price ? (variant.compare_at_price / 100).toFixed(2) : null;
          const isSelected = selectedProductId === productIds[0];
          
          return (
            <label
              key={productIds[0]}
              className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-[#D8B46B] hover:bg-[#F9F5EF]/50 transition-all"
              style={{
                borderColor: isSelected ? '#D8B46B' : '#E4D9C4',
                backgroundColor: isSelected ? 'rgba(30,58,50,0.03)' : 'white'
              }}
            >
              <input
                type="radio"
                name="format"
                value={productIds[0]}
                checked={isSelected}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-5 h-5 cursor-pointer accent-[#D8B46B]"
              />
              <div className="flex-1">
                <div className="font-semibold text-[#1E3A32]">{option.display_label}</div>
                {option.badge && (
                  <div className="text-xs bg-[#D8B46B]/20 text-[#D8B46B] px-2 py-1 rounded mt-1 inline-block">
                    {option.badge}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-[#1E3A32]">${price}</div>
                {comparePrice && comparePrice !== price && (
                  <div className="text-xs text-gray-500 line-through">${comparePrice}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Selected summary */}
      {selectedOption && (
        <div className="bg-white border border-[#E4D9C4] p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-[#1E3A32]">{selectedOption.display_label}</h3>
              {selectedOption.badge && (
                <span className="text-xs bg-[#D8B46B]/20 text-[#D8B46B] px-2 py-1 rounded mt-1 inline-block">
                  {selectedOption.badge}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#1E3A32]">${getOptionPrice(selectedOption)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleBuyNow}
          disabled={isAdding || !selectedVariant}
          className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-white py-6"
        >
          {isAdding ? <Loader2 size={18} className="animate-spin mr-2" /> : <ShoppingCart size={18} className="mr-2" />}
          {ctaLabel}
        </Button>
        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant}
          variant="outline"
          className="py-6 px-5 border-[#1E3A32] text-[#1E3A32] hover:bg-[#1E3A32]/5"
          title="Add to Cart"
        >
          <Plus size={18} className="mr-1" />
          Add to Cart
        </Button>
      </div>

      {quiz && (
        <a href={`/quiz/${quiz.slug}`} className="block text-center text-sm text-[#D8B46B] hover:text-[#C5A35B] transition-colors mt-2">
          Take the Quiz →
        </a>
      )}
    </div>
  );
}