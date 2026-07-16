import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, DollarSign, List, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    key: "",
    name: "",
    description: "",
    type: "one_time",
    active: true,
    display_order: 0,
    ui_group: "standard",
    stripe_product_id: ""
  });

  // Fetch all entities
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("display_order"),
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["productPrices"],
    queryFn: () => base44.entities.ProductPrice.list("display_order"),
  });

  const { data: features = [] } = useQuery({
    queryKey: ["productFeatures"],
    queryFn: () => base44.entities.ProductFeature.list("display_order"),
  });

  const { data: visibility = [] } = useQuery({
    queryKey: ["productVisibility"],
    queryFn: () => base44.entities.ProductVisibility.list(),
  });

  // Product mutations
  const createProduct = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsProductDialogOpen(false);
      resetProductForm();
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsProductDialogOpen(false);
      resetProductForm();
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const resetProductForm = () => {
    setProductForm({
      key: "",
      name: "",
      description: "",
      type: "one_time",
      active: true,
      display_order: 0,
      ui_group: "standard",
      stripe_product_id: ""
    });
    setEditingProduct(null);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: productForm });
    } else {
      createProduct.mutate(productForm);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Delete "${name}"? This will also delete all associated prices, features, and visibility rules.`)) {
      deleteProduct.mutate(id);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setActiveTab("prices");
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Product Catalog</h1>
            <p className="text-[#2B2725]/70">Manage products, prices, features, and visibility</p>
          </div>
          <Button
            onClick={() => {
              resetProductForm();
              setIsProductDialogOpen(true);
            }}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
          >
            <Plus size={20} className="mr-2" />
            Add Product
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="prices" disabled={!selectedProduct}>
              Prices {selectedProduct && `(${selectedProduct.name})`}
            </TabsTrigger>
            <TabsTrigger value="features" disabled={!selectedProduct}>
              Features {selectedProduct && `(${selectedProduct.name})`}
            </TabsTrigger>
            <TabsTrigger value="visibility" disabled={!selectedProduct}>
              Visibility {selectedProduct && `(${selectedProduct.name})`}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-white p-6">
              <div className="grid gap-4">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-[#E4D9C4] p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-serif text-xl text-[#1E3A32]">{product.name}</h3>
                          <span className={`text-xs px-3 py-1 ${
                            product.ui_group === "hero" ? "bg-[#D8B46B] text-[#1E3A32]" :
                            product.ui_group === "featured" ? "bg-[#A6B7A3]/20 text-[#1E3A32]" :
                            "bg-[#E4D9C4] text-[#2B2725]"
                          }`}>
                            {product.ui_group}
                          </span>
                          {product.active ? (
                            <span className="text-xs px-3 py-1 bg-green-100 text-green-800">Active</span>
                          ) : (
                            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-800">Inactive</span>
                          )}
                        </div>
                        <p className="text-[#2B2725]/70 text-sm mb-2">{product.description}</p>
                        <div className="flex gap-4 text-xs text-[#2B2725]/60">
                          <span>Key: {product.key}</span>
                          <span>Type: {product.type}</span>
                          <span>Order: {product.display_order}</span>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Prices Tab */}
          <TabsContent value="prices">
            {selectedProduct && (
              <PricesManager
                productId={selectedProduct.id}
                prices={prices.filter(p => p.product_id === selectedProduct.id)}
              />
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            {selectedProduct && (
              <FeaturesManager
                productId={selectedProduct.id}
                features={features.filter(f => f.product_id === selectedProduct.id)}
              />
            )}
          </TabsContent>

          {/* Visibility Tab */}
          <TabsContent value="visibility">
            {selectedProduct && (
              <VisibilityManager
                productId={selectedProduct.id}
                visibility={visibility.filter(v => v.product_id === selectedProduct.id)}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit" : "Add"} Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Key *</Label>
                  <Input
                    value={productForm.key}
                    onChange={(e) => setProductForm({ ...productForm, key: e.target.value })}
                    placeholder="certification"
                    required
                  />
                </div>
                <div>
                  <Label>Display Name *</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="The Mind Styling Certification™"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={productForm.type} onValueChange={(v) => setProductForm({ ...productForm, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>UI Group</Label>
                  <Select value={productForm.ui_group} onValueChange={(v) => setProductForm({ ...productForm, ui_group: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
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
                    value={productForm.display_order}
                    onChange={(e) => setProductForm({ ...productForm, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stripe Product ID</Label>
                  <Input
                    value={productForm.stripe_product_id}
                    onChange={(e) => setProductForm({ ...productForm, stripe_product_id: e.target.value })}
                    placeholder="prod_xxxxx"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={productForm.active}
                    onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? "Update" : "Create"} Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Prices Manager Component
function PricesManager({ productId, prices }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    product_id: productId,
    billing_type: "one_time",
    amount: 0,
    currency: "usd",
    interval: "one_time",
    interval_count: 1,
    installments: null,
    label: "",
    recommended: false,
    visible: true,
    stripe_price_id: "",
    display_order: 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductPrice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPrices"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductPrice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPrices"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductPrice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPrices"] });
    },
  });

  const resetForm = () => {
    setForm({
      product_id: productId,
      billing_type: "one_time",
      amount: 0,
      currency: "usd",
      interval: "one_time",
      interval_count: 1,
      installments: null,
      label: "",
      recommended: false,
      visible: true,
      stripe_price_id: "",
      display_order: 0
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (price) => {
    setEditing(price);
    setForm(price);
    setIsDialogOpen(true);
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-[#1E3A32]">Price Tiers</h3>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm">
          <Plus size={16} className="mr-2" />
          Add Price
        </Button>
      </div>

      <div className="grid gap-4">
        {prices.map((price) => (
          <div key={price.id} className="border border-[#E4D9C4] p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-[#1E3A32]">{price.label}</span>
                  {price.recommended && <span className="text-xs px-2 py-1 bg-[#D8B46B] text-[#1E3A32]">Recommended</span>}
                  {!price.visible && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">Hidden</span>}
                </div>
                <div className="text-sm text-[#2B2725]/70">
                  <p>${(price.amount / 100).toFixed(2)} {price.currency.toUpperCase()}</p>
                  <p>{price.billing_type} • {price.interval}</p>
                  {price.installments && <p>{price.installments} installments</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(price)}>
                  <Edit size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteMutation.mutate(price.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Price</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Label *</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
              </div>
              <div>
                <Label>Amount (cents) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) })} required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Billing Type</Label>
                <Select value={form.billing_type} onValueChange={(v) => setForm({ ...form, billing_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interval</Label>
                <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Installments</Label>
                <Input type="number" value={form.installments || ""} onChange={(e) => setForm({ ...form, installments: e.target.value ? parseInt(e.target.value) : null })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stripe Price ID</Label>
                <Input value={form.stripe_price_id} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} />
                <Label>Recommended</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
                <Label>Visible</Label>
              </div>
            </div>
            <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Price</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Features Manager Component
function FeaturesManager({ productId, features }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ product_id: productId, text: "", display_order: 0 });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductFeature.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productFeatures"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductFeature.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productFeatures"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductFeature.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productFeatures"] }),
  });

  const resetForm = () => {
    setForm({ product_id: productId, text: "", display_order: 0 });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-[#1E3A32]">Product Features</h3>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm">
          <Plus size={16} className="mr-2" />
          Add Feature
        </Button>
      </div>

      <div className="space-y-2">
        {features.map((feature) => (
          <div key={feature.id} className="border border-[#E4D9C4] p-3 flex justify-between items-center">
            <span className="text-[#2B2725]">{feature.text}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setEditing(feature); setForm(feature); setIsDialogOpen(true); }}>
                <Edit size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteMutation.mutate(feature.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Feature</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Feature Text *</Label>
              <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) })} />
            </div>
            <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Feature</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Visibility Manager Component
function VisibilityManager({ productId, visibility }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    product_id: productId,
    context: "public",
    show_price: true,
    cta_text: "",
    cta_url: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductVisibility.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVisibility"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductVisibility.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVisibility"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductVisibility.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productVisibility"] }),
  });

  const resetForm = () => {
    setForm({ product_id: productId, context: "public", show_price: true, cta_text: "", cta_url: "" });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-[#1E3A32]">Visibility Rules</h3>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm">
          <Plus size={16} className="mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-2">
        {visibility.map((rule) => (
          <div key={rule.id} className="border border-[#E4D9C4] p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium text-[#1E3A32] capitalize">{rule.context}</span>
                <div className="text-sm text-[#2B2725]/70 mt-1">
                  <p>Show Price: {rule.show_price ? "Yes" : "No"}</p>
                  {rule.cta_text && <p>CTA: {rule.cta_text}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(rule); setForm(rule); setIsDialogOpen(true); }}>
                  <Edit size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteMutation.mutate(rule.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Visibility Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Context *</Label>
              <Select value={form.context} onValueChange={(v) => setForm({ ...form, context: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="authenticated">Authenticated</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.show_price} onChange={(e) => setForm({ ...form, show_price: e.target.checked })} />
              <Label>Show Price</Label>
            </div>
            <div>
              <Label>CTA Text</Label>
              <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
            </div>
            <div>
              <Label>CTA URL</Label>
              <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Rule</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}