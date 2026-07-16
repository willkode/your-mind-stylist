import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, Lock, Play, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import SEO from "../components/SEO";

export default function WebinarPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");
  const paymentStatus = urlParams.get("payment");

  // Fetch webinar
  const { data: webinars = [], isLoading } = useQuery({
    queryKey: ["webinar", slug],
    queryFn: () => base44.entities.Webinar.filter({ slug }),
    enabled: !!slug,
  });
  const webinar = webinars[0];

  // Fetch user access if authenticated
  const { data: userAccess = [], refetch: refetchAccess } = useQuery({
    queryKey: ["webinar-access", user?.id, webinar?.id],
    queryFn: () => base44.entities.UserWebinarAccess.filter({ 
      user_id: user.id, 
      webinar_id: webinar.id 
    }),
    enabled: !!user?.id && !!webinar?.id,
  });

  const hasAccess = userAccess.length > 0;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // User not authenticated
      }
    };
    fetchUser();
  }, []);

  // Handle payment success
  useEffect(() => {
    if (paymentStatus === 'success' && webinar) {
      refetchAccess();
      // Show success message
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname + '?slug=' + slug);
      }, 3000);
    }
  }, [paymentStatus, webinar, refetchAccess, slug]);

  // Grant free access
  const grantAccessMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserWebinarAccess.create({
        user_id: user.id,
        webinar_id: webinar.id,
        access_type: "free",
        access_granted_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webinar-access"] });
    },
  });

  // Purchase webinar
  const handlePurchase = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    if (!webinar.stripe_price_id) {
      alert('This webinar is not yet available for purchase. Please try again later.');
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await base44.functions.invoke('createWebinarCheckout', {
        webinar_id: webinar.id
      });
      window.location.href = response.data.checkout_url;
    } catch (error) {
      alert('Failed to start checkout: ' + error.message);
      setIsCheckingOut(false);
    }
  };

  const handleStartWatching = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    if (webinar.access_level === 'free' && !hasAccess) {
      grantAccessMutation.mutate();
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading webinar...</p>
        </div>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">Webinar Not Found</h1>
          <p className="text-[#2B2725]/70">The webinar you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Check if user can access content
  const canAccessContent = webinar.status === 'published' && (
    webinar.access_level === 'free' || hasAccess
  );

  // Render minimal template
  if (webinar.template_choice === 'minimal') {
    return (
      <>
        <SEO 
          title={`${webinar.title} | Your Mind Stylist`}
          description={webinar.short_description || webinar.title}
          ogImage={webinar.thumbnail}
          canonical={`/WebinarPage?slug=${slug}`}
        />
        
        <div className="min-h-screen bg-[#F9F5EF]">
          {/* Payment Success Banner */}
          <AnimatePresence>
            {paymentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-green-500 text-white py-3 px-6 text-center"
              >
                <CheckCircle className="inline mr-2" size={20} />
                Payment successful! You now have access to this webinar.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-4xl mx-auto px-6 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              {webinar.featured && (
                <Badge className="bg-[#D8B46B] text-white mb-4">Featured Webinar</Badge>
              )}
              <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
                {webinar.title}
              </h1>
              {webinar.short_description && (
                <p className="text-xl text-[#2B2725]/70 max-w-2xl mx-auto">
                  {webinar.short_description}
                </p>
              )}
            </motion.div>

            {/* Video Player */}
            {canAccessContent && webinar.media_url ? (
              <div className="bg-black rounded-lg overflow-hidden mb-8 aspect-video">
                <iframe
                  src={webinar.media_url}
                  className="w-full h-full"
                  allowFullScreen
                  title={webinar.title}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] text-white rounded-lg p-12 text-center mb-8">
                <Lock size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="font-serif text-2xl mb-4">
                  {webinar.access_level === 'free' ? 'Sign In to Watch' : 'Purchase to Access'}
                </h3>
                {webinar.access_level === 'paid' && (
                  <p className="text-3xl font-bold mb-6">{formatPrice(webinar.price)}</p>
                )}
                <Button
                  onClick={webinar.access_level === 'free' ? handleStartWatching : handlePurchase}
                  disabled={isCheckingOut || grantAccessMutation.isPending}
                  className="bg-white text-[#1E3A32] hover:bg-[#F9F5EF]"
                  size="lg"
                >
                  {isCheckingOut ? 'Processing...' : 
                   grantAccessMutation.isPending ? 'Loading...' :
                   webinar.access_level === 'free' ? 'Watch Now' : 'Purchase Access'}
                </Button>
              </div>
            )}

            {/* Description */}
            {webinar.description && (
              <div className="bg-white p-8 rounded-lg">
                <div
                  className="prose prose-lg max-w-none text-[#2B2725]/80"
                  dangerouslySetInnerHTML={{ __html: webinar.description }}
                />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Render detailed template (default)
  return (
    <>
      <SEO 
        title={`${webinar.title} | Your Mind Stylist`}
        description={webinar.short_description || webinar.title}
        ogImage={webinar.thumbnail}
        canonical={`/WebinarPage?slug=${slug}`}
      />
      
      <div className="min-h-screen bg-[#F9F5EF]">
        {/* Payment Success Banner */}
        <AnimatePresence>
          {paymentStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-500 text-white py-3 px-6 text-center"
            >
              <CheckCircle className="inline mr-2" size={20} />
              Payment successful! You now have access to this webinar.
            </motion.div>
          )}
          {paymentStatus === 'cancelled' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-yellow-500 text-white py-3 px-6 text-center"
            >
              Payment cancelled. You can try again anytime.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {webinar.featured && (
                  <Badge className="bg-[#D8B46B] text-white mb-4">Featured Webinar</Badge>
                )}
                <h1 className="font-serif text-4xl md:text-5xl mb-4">{webinar.title}</h1>
                {webinar.short_description && (
                  <p className="text-xl text-white/90 mb-6">{webinar.short_description}</p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm mb-8">
                  {webinar.scheduled_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{format(new Date(webinar.scheduled_date), "MMMM d, yyyy")}</span>
                    </div>
                  )}
                  {webinar.duration_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{webinar.duration_minutes} minutes</span>
                    </div>
                  )}
                  {webinar.host_name && (
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>with {webinar.host_name}</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {!canAccessContent && (
                  <div className="flex flex-col gap-4">
                    {webinar.access_level === 'paid' && (
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-2">
                        <p className="text-sm text-white/70 mb-2">Investment</p>
                        <p className="text-3xl font-bold">{formatPrice(webinar.price)}</p>
                      </div>
                    )}
                    <Button
                      onClick={webinar.access_level === 'free' ? handleStartWatching : handlePurchase}
                      disabled={isCheckingOut || grantAccessMutation.isPending}
                      className="bg-[#D8B46B] hover:bg-[#C9A55B] text-white"
                      size="lg"
                    >
                      {isCheckingOut ? 'Processing...' : 
                       grantAccessMutation.isPending ? 'Loading...' :
                       webinar.access_level === 'free' ? 'Watch Free Webinar' : 'Get Instant Access'}
                    </Button>
                  </div>
                )}
                {canAccessContent && (
                  <Badge className="bg-green-500 text-white px-4 py-2">
                    <CheckCircle className="inline mr-2" size={16} />
                    You have access
                  </Badge>
                )}
              </motion.div>

              {/* Thumbnail */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {webinar.thumbnail ? (
                  <img
                    src={webinar.thumbnail}
                    alt={webinar.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-video bg-white/10 rounded-lg flex items-center justify-center">
                    <Play size={64} className="text-white/50" />
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              {canAccessContent && webinar.media_url && (
                <div className="bg-black rounded-lg overflow-hidden mb-8 aspect-video">
                  <iframe
                    src={webinar.media_url}
                    className="w-full h-full"
                    allowFullScreen
                    title={webinar.title}
                  />
                </div>
              )}

              {/* Description */}
              {webinar.description && (
                <div className="bg-white p-8 rounded-lg mb-8">
                  <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">About This Webinar</h2>
                  <div
                    className="prose prose-lg max-w-none text-[#2B2725]/80"
                    dangerouslySetInnerHTML={{ __html: webinar.description }}
                  />
                </div>
              )}

              {/* Learning Outcomes */}
              {webinar.learning_outcomes && webinar.learning_outcomes.length > 0 && (
                <div className="bg-white p-8 rounded-lg">
                  <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                    What You'll Learn
                  </h2>
                  <div className="space-y-3">
                    {webinar.learning_outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-[#D8B46B] mt-1 flex-shrink-0" />
                        <p className="text-[#2B2725]/80">{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Host Info */}
              {(webinar.host_name || webinar.host_bio) && (
                <div className="bg-white p-6 rounded-lg mb-6">
                  <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Your Host</h3>
                  {webinar.host_image && (
                    <img
                      src={webinar.host_image}
                      alt={webinar.host_name}
                      className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                  )}
                  {webinar.host_name && (
                    <p className="font-medium text-[#1E3A32] mb-2">{webinar.host_name}</p>
                  )}
                  {webinar.host_bio && (
                    <p className="text-sm text-[#2B2725]/70">{webinar.host_bio}</p>
                  )}
                </div>
              )}

              {/* Access CTA */}
              {!canAccessContent && (
                <div className="bg-[#1E3A32] text-white p-6 rounded-lg sticky top-6">
                  <h3 className="font-serif text-xl mb-4">Get Access Now</h3>
                  {webinar.access_level === 'paid' && (
                    <p className="text-3xl font-bold mb-4">{formatPrice(webinar.price)}</p>
                  )}
                  <Button
                    onClick={webinar.access_level === 'free' ? handleStartWatching : handlePurchase}
                    disabled={isCheckingOut || grantAccessMutation.isPending}
                    className="w-full bg-[#D8B46B] hover:bg-[#C9A55B] text-white"
                    size="lg"
                  >
                    {isCheckingOut ? 'Processing...' : 
                     grantAccessMutation.isPending ? 'Loading...' :
                     webinar.access_level === 'free' ? 'Watch Free' : 'Purchase Now'}
                  </Button>
                  <p className="text-xs text-white/60 mt-3 text-center">
                    Instant access • Watch anytime
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}