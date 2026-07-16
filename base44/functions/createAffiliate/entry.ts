import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Generate unique affiliate code
function generateAffiliateCode(name) {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${random}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { custom_message } = await req.json();

    // Check if user already has an affiliate account
    const existing = await base44.entities.Affiliate.filter({ user_id: user.id });
    if (existing.length > 0) {
      return Response.json({ 
        error: 'You already have an affiliate account',
        affiliate: existing[0]
      }, { status: 400 });
    }

    // Generate unique code
    let affiliateCode = generateAffiliateCode(user.full_name || user.email);
    
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const codeExists = await base44.entities.Affiliate.filter({ affiliate_code: affiliateCode });
      if (codeExists.length === 0) break;
      affiliateCode = generateAffiliateCode(user.full_name || user.email);
      attempts++;
    }

    // Create affiliate account
    const affiliate = await base44.entities.Affiliate.create({
      user_id: user.id,
      affiliate_code: affiliateCode,
      status: 'pending',
      commission_rate: 20, // Default 20%
      commission_tier: 'standard',
      referral_link: `https://yourmindstylist.com?ref=${affiliateCode}`,
      custom_message: custom_message || '',
      total_referrals: 0,
      successful_conversions: 0,
      total_revenue_generated: 0,
      total_commission_earned: 0,
      commission_pending: 0,
      commission_paid: 0
    });

    // Notify manager
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'roberta@yourmindstylist.com',
        subject: 'New Affiliate Application',
        body: `
          <h2>New Affiliate Application</h2>
          <p><strong>Name:</strong> ${user.full_name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Code:</strong> ${affiliateCode}</p>
          <p><strong>Message:</strong> ${custom_message || 'None'}</p>
          <br>
          <p>Review and approve in the Manager Dashboard.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send notification:', emailError);
    }

    return Response.json({
      success: true,
      affiliate,
      message: 'Your affiliate application has been submitted and is pending approval.'
    });

  } catch (error) {
    console.error('Create affiliate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});