import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products
    const allProducts = await base44.entities.Product.filter({ 
      status: 'published',
      active: true 
    });

    // Check what user owns
    const ownedProducts = [];
    
    // Check Pocket Visualization subscription
    if (user.pocket_visualization_active) {
      ownedProducts.push('pocket-visualization');
    }

    // Check course access
    const courseProgress = await base44.entities.UserCourseProgress.filter({
      user_id: user.id
    });
    
    for (const progress of courseProgress) {
      const product = allProducts.find(p => p.related_course_id === progress.course_id);
      if (product) {
        ownedProducts.push(product.key);
      }
    }

    // Check webinar access
    const webinarAccess = await base44.entities.UserWebinarAccess.filter({
      user_email: user.email
    });
    
    for (const access of webinarAccess) {
      const product = allProducts.find(p => p.related_webinar_id === access.webinar_id);
      if (product) {
        ownedProducts.push(product.key);
      }
    }

    // Recommendation logic based on ownership
    const recommendations = [];

    // Rule 1: If owns nothing → recommend Pocket Visualization + Mini-Webinar
    if (ownedProducts.length === 0) {
      recommendations.push({
        product_key: 'pocket-visualization',
        rationale: "When you're ready to begin, Pocket Visualization™ is a gentle place to start.",
        reason: "Perfect for daily emotional reset and building consistency",
        priority: 1
      });
      
      recommendations.push({
        product_key: 'mini-webinars',
        rationale: "Short, focused lessons on specific psychological themes.",
        reason: "Learn foundational Mind Styling concepts at your own pace",
        priority: 2
      });
    }

    // Rule 2: If has PV but no Toolkit → recommend Toolkit
    const hasToolkit = ownedProducts.some(key => key.includes('toolkit'));
    if (ownedProducts.includes('pocket-visualization') && !hasToolkit) {
      recommendations.push({
        product_key: 'toolkit-bundle',
        rationale: "You've built a foundation with Pocket Visualization. The Toolkit deepens your practice.",
        reason: "Structured learning to master Mind Styling principles",
        priority: 1
      });
    }

    // Rule 3: If has Toolkit but no high-touch → recommend Salon
    const hasHighTouch = ownedProducts.some(key => 
      ['salon-coaching', 'couture-coaching'].includes(key)
    );
    
    if (hasToolkit && !hasHighTouch) {
      recommendations.push({
        product_key: 'salon-coaching',
        rationale: "Ready to go deeper? Join a community of practitioners in live group coaching.",
        reason: "Monthly live sessions plus personalized toolkit guidance",
        priority: 1
      });
    }

    // Rule 4: If has Salon → recommend Couture
    if (ownedProducts.includes('salon-coaching') && !ownedProducts.includes('couture-coaching')) {
      recommendations.push({
        product_key: 'couture-coaching',
        rationale: "If this feels like your next step, intensive 1:1 work offers the deepest transformation.",
        reason: "Bespoke hypnosis and personal coaching tailored to your journey",
        priority: 1
      });
    }

    // Get full product details for recommendations
    const recommendedProducts = recommendations.map(rec => {
      const product = allProducts.find(p => p.key === rec.product_key);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null);

    // Sort by priority
    recommendedProducts.sort((a, b) => a.priority - b.priority);

    return Response.json({
      recommendations: recommendedProducts.slice(0, 3), // Return top 3
      owned_products: ownedProducts
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});