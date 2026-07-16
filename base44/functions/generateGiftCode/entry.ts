import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only managers can generate gift codes
    if (user?.role !== 'admin' && user?.custom_role !== 'manager') {
      return Response.json({ error: 'Unauthorized: Managers only' }, { status: 403 });
    }

    const { product_id, product_type, recipient_email, recipient_name, notes, is_single_use, max_uses, expires_at } = await req.json();

    if (!product_id || !product_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique code (10 char uppercase alphanumeric)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code = generateCode();
    let isUnique = false;
    let attempts = 0;

    // Ensure code is unique
    while (!isUnique && attempts < 10) {
      const existing = await base44.asServiceRole.entities.GiftCode.filter({ code });
      if (existing.length === 0) {
        isUnique = true;
      } else {
        code = generateCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return Response.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }

    // Create gift code
    const giftCode = await base44.asServiceRole.entities.GiftCode.create({
      code,
      product_id,
      product_type,
      recipient_email: recipient_email || null,
      recipient_name: recipient_name || null,
      is_single_use: is_single_use !== undefined ? is_single_use : true,
      max_uses: max_uses || null,
      expires_at: expires_at || null,
      is_active: true,
      notes: notes || null,
      discount_percentage: 100
    });

    return Response.json({
      success: true,
      code: giftCode.code,
      message: `Gift code ${giftCode.code} created successfully`
    });
  } catch (error) {
    console.error('Error generating gift code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});