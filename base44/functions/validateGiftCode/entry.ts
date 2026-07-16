import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, product_id } = await req.json();

    if (!code || !product_id) {
      return Response.json({ error: 'Missing code or product_id' }, { status: 400 });
    }

    // Find gift code
    const giftCodes = await base44.asServiceRole.entities.GiftCode.filter({ code: code.toUpperCase() });
    const giftCode = giftCodes[0];

    if (!giftCode) {
      return Response.json({ 
        valid: false, 
        error: 'Gift code not found' 
      }, { status: 404 });
    }

    // Check if code is for the correct product
    if (giftCode.product_id !== product_id) {
      return Response.json({ 
        valid: false, 
        error: 'This code is not valid for this product' 
      });
    }

    // Check if code is active
    if (!giftCode.is_active) {
      return Response.json({ 
        valid: false, 
        error: 'This gift code is no longer active' 
      });
    }

    // Check expiration
    if (giftCode.expires_at) {
      const expiresAt = new Date(giftCode.expires_at);
      if (new Date() > expiresAt) {
        return Response.json({ 
          valid: false, 
          error: 'This gift code has expired' 
        });
      }
    }

    // Check usage limits
    const timesUsed = giftCode.times_used || 0;
    if (giftCode.max_uses && timesUsed >= giftCode.max_uses) {
      return Response.json({ 
        valid: false, 
        error: 'This gift code has reached its usage limit' 
      });
    }

    // Check if already used (for single-use codes)
    if (giftCode.is_single_use && timesUsed > 0) {
      return Response.json({ 
        valid: false, 
        error: 'This gift code has already been used' 
      });
    }

    return Response.json({
      valid: true,
      discount_percentage: giftCode.discount_percentage,
      discount_amount: 100, // 100% off
      recipient_user_id: giftCode.recipient_user_id,
      recipient_email: giftCode.recipient_email,
      recipient_name: giftCode.recipient_name
    });
  } catch (error) {
    console.error('Error validating gift code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});