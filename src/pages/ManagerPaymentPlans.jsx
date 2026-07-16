import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Trash2, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import { createPageUrl } from "../utils";

export default function ManagerPaymentPlans() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [plans, setPlans] = useState([
    { name: "3 Monthly Payments", months: 3, monthly_price: 0 },
  ]);

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.filter({ active: true }),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(createPageUrl("ManagerPaymentPlans"));
        }
        setIsAuthenticated(isAuth);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("ManagerPaymentPlans"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const syncPaymentPlansMutation = useMutation({
    mutationFn: ({ product_id, payment_plan_options }) =>
      base44.functions.invoke("syncPaymentPlans", { product_id, payment_plan_options }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Payment plans synced to Stripe");
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sync payment plans");
    },
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">Loading...</div>;
  }

  const handleOpenDialog = (product) => {
    setSelectedProduct(product);
    if (product.payment_plan_options && product.payment_plan_options.length > 0) {
      setPlans(product.payment_plan_options);
    } else {
      // Calculate default plans based on product price
      const fullPrice = product.price / 100;
      setPlans([
        { name: "3 Monthly Payments", months: 3, monthly_price: Math.round((fullPrice / 3) * 100) },
        { name: "6 Monthly Payments", months: 6, monthly_price: Math.round((fullPrice / 6) * 100) },
      ]);
    }
    setDialogOpen(true);
  };

  const handleAddPlan = () => {
    setPlans([...plans, { name: "", months: 3, monthly_price: 0 }]);
  };

  const handleRemovePlan = (index) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handlePlanChange = (index, field, value) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPlans(newPlans);
  };

  const handleSyncPlans = () => {
    if (!selectedProduct) return;
    
    // Validate plans
    const validPlans = plans.filter(p => p.name && p.months > 0 && p.monthly_price > 0);
    if (validPlans.length === 0) {
      toast.error("Please add at least one valid payment plan");
      return;
    }

    syncPaymentPlansMutation.mutate({
      product_id: selectedProduct.id,
      payment_plan_options: validPlans,
    });
  };

  // Filter products eligible for payment plans (high-ticket items)
  const eligibleProducts = products.filter(p => p.price >= 50000); // $500+

  if (isProductsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Payment Plans</h1>
          <p className="text-[#2B2725]/70">
            Configure installment payment options for high-ticket products
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eligibleProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>
                  ${(product.price / 100).toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {product.payment_plan_options && product.payment_plan_options.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {product.payment_plan_options.map((plan, idx) => (
                      <div key={idx} className="text-sm text-[#2B2725]/80 flex items-center gap-2">
                        <CreditCard size={14} className="text-[#D8B46B]" />
                        <span>{plan.name}: ${(plan.monthly_price / 100).toFixed(2)}/mo</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#2B2725]/60 mb-4">
                    No payment plans configured
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOpenDialog(product)}
                >
                  <CreditCard size={16} className="mr-2" />
                  {product.payment_plan_options?.length > 0 ? "Edit Plans" : "Add Plans"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {eligibleProducts.length === 0 && (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-[#2B2725]/30 mb-4" />
            <p className="text-[#2B2725]/60">
              No products eligible for payment plans. Products must be $500+
            </p>
          </div>
        )}
      </div>

      {/* Configure Payment Plans Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Payment Plans</DialogTitle>
            {selectedProduct && (
              <p className="text-sm text-[#2B2725]/70">
                {selectedProduct.name} - ${(selectedProduct.price / 100).toFixed(2)}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-6 py-4">
            {plans.map((plan, index) => (
              <div key={index} className="border border-[#E4D9C4] p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-[#1E3A32]">Payment Plan {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePlan(index)}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </div>

                <div>
                  <Label>Plan Name</Label>
                  <Input
                    value={plan.name}
                    onChange={(e) => handlePlanChange(index, "name", e.target.value)}
                    placeholder="e.g., 3 Monthly Payments"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Months</Label>
                    <Input
                      type="number"
                      min="2"
                      max="12"
                      value={plan.months}
                      onChange={(e) => handlePlanChange(index, "months", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Monthly Payment (cents)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={plan.monthly_price}
                      onChange={(e) => handlePlanChange(index, "monthly_price", parseInt(e.target.value))}
                      placeholder="e.g., 66500 = $665"
                    />
                  </div>
                </div>

                <div className="bg-[#F9F5EF] p-3 rounded text-sm">
                  <p className="text-[#2B2725]/80">
                    Monthly: <span className="font-medium">${(plan.monthly_price / 100).toFixed(2)}</span>
                  </p>
                  <p className="text-[#2B2725]/80">
                    Total: <span className="font-medium">${((plan.monthly_price * plan.months) / 100).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleAddPlan}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add Another Plan
            </Button>

            <Button
              onClick={handleSyncPlans}
              disabled={syncPaymentPlansMutation.isPending}
              className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              {syncPaymentPlansMutation.isPending ? "Syncing..." : "Sync to Stripe"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}