import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    try {
        // Get raw body text for signature verification
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return Response.json({ error: 'No signature' }, { status: 400 });
        }

        // Initialize base44 AFTER getting the body
        const base44 = createClientFromRequest(req);

        // Helper to extract customer details (phone + address) from Stripe session
        const extractCustomerDetails = (session) => {
            const details = {};
            const cd = session.customer_details;
            if (cd) {
                if (cd.phone) details.phone = cd.phone;
                if (cd.address) {
                    if (cd.address.line1) details.address_line1 = cd.address.line1;
                    if (cd.address.line2) details.address_line2 = cd.address.line2;
                    if (cd.address.city) details.city = cd.address.city;
                    if (cd.address.state) details.state = cd.address.state;
                    if (cd.address.postal_code) details.zip = cd.address.postal_code;
                    if (cd.address.country) details.country = cd.address.country;
                }
            }
            // Also check shipping details
            const sd = session.shipping_details;
            if (sd?.address) {
                if (!details.address_line1 && sd.address.line1) details.address_line1 = sd.address.line1;
                if (!details.address_line2 && sd.address.line2) details.address_line2 = sd.address.line2;
                if (!details.city && sd.address.city) details.city = sd.address.city;
                if (!details.state && sd.address.state) details.state = sd.address.state;
                if (!details.zip && sd.address.postal_code) details.zip = sd.address.postal_code;
                if (!details.country && sd.address.country) details.country = sd.address.country;
            }
            return details;
        };

        // Helper to track affiliate referral
        const trackAffiliate = async (session) => {
            const affiliateCode = session.metadata?.affiliate_code || session.client_reference_id;
            if (affiliateCode) {
                try {
                    await base44.asServiceRole.functions.invoke('trackAffiliateReferral', {
                        affiliate_code: affiliateCode,
                        referred_user_email: session.customer_email,
                        referred_user_id: session.metadata?.user_id,
                        conversion_type: session.metadata?.type || 'product',
                        product_id: session.metadata?.product_id,
                        product_name: session.metadata?.product_name,
                        purchase_amount: session.amount_total,
                        stripe_payment_intent_id: session.payment_intent
                    });
                } catch (affError) {
                    console.error('Affiliate tracking failed:', affError);
                }
            }
        };

        // Verify webhook signature
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Idempotency guard: Stripe retries deliveries — skip events we've already processed
        const alreadyProcessed = await base44.asServiceRole.entities.ProcessedStripeEvent.filter({ event_id: event.id });
        if (alreadyProcessed.length > 0) {
            return Response.json({ received: true, duplicate: true });
        }
        await base44.asServiceRole.entities.ProcessedStripeEvent.create({ event_id: event.id, event_type: event.type });

        // Helper to consume a gift code after successful payment
        const consumeGiftCode = async (code) => {
            const codes = await base44.asServiceRole.entities.GiftCode.filter({ code: code.toUpperCase() });
            const gc = codes[0];
            if (gc) {
                await base44.asServiceRole.entities.GiftCode.update(gc.id, {
                    times_used: (gc.times_used || 0) + 1,
                    is_active: gc.is_single_use ? false : gc.is_active,
                });
            }
        };

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                
                // Handle Credit Tier Upgrade (check first, before other handlers)
                if (session.metadata?.type === 'credit_tier_upgrade') {
                    const tierKey = session.metadata.credit_tier;
                    const userEmail = session.metadata.user_email;
                    const monthlyLimit = parseInt(session.metadata.monthly_limit) || 500;
                    const now = new Date();
                    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

                    const allowances = await base44.asServiceRole.entities.CreditAllowance.filter({ user_email: userEmail });
                    if (allowances.length > 0) {
                        await base44.asServiceRole.entities.CreditAllowance.update(allowances[0].id, {
                            tier: tierKey,
                            monthly_limit: monthlyLimit,
                            credits_remaining: monthlyLimit - (allowances[0].credits_used || 0),
                            stripe_subscription_id: session.subscription,
                            stripe_customer_id: session.customer,
                            period_start: now.toISOString(),
                            period_end: periodEnd.toISOString(),
                        });
                    } else {
                        await base44.asServiceRole.entities.CreditAllowance.create({
                            user_email: userEmail,
                            user_name: session.customer_details?.name || '',
                            tier: tierKey,
                            monthly_limit: monthlyLimit,
                            credits_used: 0,
                            credits_remaining: monthlyLimit,
                            stripe_subscription_id: session.subscription,
                            stripe_customer_id: session.customer,
                            period_start: now.toISOString(),
                            period_end: periodEnd.toISOString(),
                            last_reset_date: now.toISOString(),
                        });
                    }
                    console.log(`Credit tier upgraded: ${userEmail} -> ${tierKey} (${monthlyLimit} credits)`);
                    return Response.json({ received: true });
                }

                // Track affiliate referral for all conversions
                await trackAffiliate(session);
                
                // Handle Booking (Private Sessions)
                if (session.metadata.booking_id) {
                    await base44.asServiceRole.entities.Booking.update(session.metadata.booking_id, {
                        payment_status: 'paid',
                        booking_status: 'confirmed',
                        stripe_payment_intent_id: session.payment_intent
                    });

                    // Upsert CRM lead with name from booking
                    try {
                        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: session.metadata.booking_id });
                        if (bookings.length > 0) {
                            const booking = bookings[0];
                            const customerInfo = extractCustomerDetails(session);
                            const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email: booking.user_email });
                            const bookingDate = new Date().toISOString().split('T')[0];
                            if (existingLeads.length > 0) {
                                const existing = existingLeads[0];
                                const updates = { last_activity_date: new Date().toISOString(), ...customerInfo };
                                if (!existing.full_name && booking.user_name) updates.full_name = booking.user_name;
                                if (!existing.phone && booking.client_phone) updates.phone = booking.client_phone;
                                const boughtHistory = existing.what_they_bought
                                    ? `${existing.what_they_bought}, ${booking.service_type}`
                                    : booking.service_type;
                                updates.what_they_bought = boughtHistory;
                                updates.date_of_purchase = bookingDate;
                                updates.stage = 'booked';
                                updates.notes = `${existing.notes || ''}\n[${new Date().toLocaleDateString()}] Booked: ${booking.service_type}`.trim();
                                await base44.asServiceRole.entities.Lead.update(existing.id, updates);
                            } else {
                                const nameParts = (booking.user_name || '').split(' ');
                                await base44.asServiceRole.entities.Lead.create({
                                    full_name: booking.user_name || '',
                                    first_name: nameParts[0] || '',
                                    last_name: nameParts.slice(1).join(' ') || '',
                                    email: booking.user_email,
                                    phone: booking.client_phone || '',
                                    stage: 'booked',
                                    source: 'booking_system',
                                    interest_level: 'hot',
                                    lead_score: 75,
                                    what_they_bought: booking.service_type,
                                    date_of_purchase: bookingDate,
                                    notes: `Initial booking: ${booking.service_type} - ${booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleString() : 'date TBD'}`,
                                    ...customerInfo,
                                });
                            }
                        }
                    } catch (crmError) {
                        console.error('CRM update failed (non-critical):', crmError.message);
                    }

                    // Auto-tag user for booking completion
                    if (session.metadata.user_id) {
                        try {
                            await base44.asServiceRole.functions.invoke('autoTagUser', {
                                user_id: session.metadata.user_id,
                                event_type: 'booking_completed'
                            });
                        } catch (tagError) {
                            console.error('Auto-tagging failed:', tagError);
                        }
                    }

                    // Auto-create Zoom meeting
                    try {
                        await base44.asServiceRole.functions.invoke('createZoomMeeting', {
                            booking_id: session.metadata.booking_id
                        });
                    } catch (zoomError) {
                        console.error('Zoom meeting creation failed:', zoomError);
                    }

                    // Send professional booking confirmation emails
                    try {
                        await base44.asServiceRole.functions.invoke('sendBookingNotifications', {
                            booking_id: session.metadata.booking_id,
                            notification_type: 'booking_confirmation_client'
                        });
                        await base44.asServiceRole.functions.invoke('sendBookingNotifications', {
                            booking_id: session.metadata.booking_id,
                            notification_type: 'booking_confirmation_manager'
                        });
                    } catch (emailError) {
                        console.error('Email send failed:', emailError);
                    }
                }
                
                // Handle Webinar Purchase
                else if (session.metadata.type === 'webinar_purchase' && session.metadata.webinar_id && session.metadata.user_id) {
                    // Grant webinar access
                    await base44.asServiceRole.entities.UserWebinarAccess.create({
                        user_id: session.metadata.user_id,
                        webinar_id: session.metadata.webinar_id,
                        access_type: 'purchased',
                        access_granted_date: new Date().toISOString(),
                        purchase_date: new Date().toISOString(),
                        stripe_payment_intent_id: session.payment_intent
                    });

                    // Increment registration count
                    const webinars = await base44.asServiceRole.entities.Webinar.filter({ id: session.metadata.webinar_id });
                    if (webinars.length > 0) {
                        const webinar = webinars[0];
                        await base44.asServiceRole.entities.Webinar.update(webinar.id, {
                            registration_count: (webinar.registration_count || 0) + 1
                        });
                    }

                    // Add to CRM
                    try {
                        const customerInfo = extractCustomerDetails(session);
                        const webinarLeads = await base44.asServiceRole.entities.Lead.filter({ email: session.customer_email });
                        const webinarName = session.metadata.webinar_slug || 'Webinar';
                        const today = new Date().toISOString().split('T')[0];
                        if (webinarLeads.length > 0) {
                            const existing = webinarLeads[0];
                            const boughtHistory = existing.what_they_bought ? `${existing.what_they_bought}, ${webinarName}` : webinarName;
                            await base44.asServiceRole.entities.Lead.update(existing.id, {
                                what_they_bought: boughtHistory,
                                date_of_purchase: today,
                                stage: 'won',
                                converted_to_client: true,
                                notes: `${existing.notes || ''}\n[${new Date().toLocaleDateString()}] Purchased webinar: ${webinarName}`.trim(),
                                ...customerInfo,
                            });
                        } else {
                            const nameParts = (session.customer_details?.name || '').split(' ');
                            await base44.asServiceRole.entities.Lead.create({
                                full_name: session.customer_details?.name || '',
                                first_name: nameParts[0] || '',
                                last_name: nameParts.slice(1).join(' ') || '',
                                email: session.customer_email,
                                stage: 'won',
                                source: 'product_purchase',
                                interest_level: 'hot',
                                lead_score: 75,
                                converted_to_client: true,
                                converted_date: new Date().toISOString(),
                                what_they_bought: webinarName,
                                date_of_purchase: today,
                                notes: `Purchased webinar: ${webinarName}`,
                                ...customerInfo,
                            });
                        }
                    } catch (crmErr) {
                        console.error('CRM update for webinar failed:', crmErr.message);
                    }

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: session.customer_email,
                        subject: 'Webinar Access Granted',
                        body: `
                            <h2>Welcome! Your webinar access is confirmed.</h2>
                            <p>Your payment has been processed and you now have access to watch anytime.</p>
                            <p>Access your webinar: https://yourmindstylist.com/WebinarPage?slug=${session.metadata.webinar_slug || ''}</p>
                            <br>
                            <p>Roberta Fernandez<br>Your Mind Stylist</p>
                        `
                    });

                    // Notify Roberta of webinar purchase
                    try {
                        const webinarName = session.metadata.webinar_slug || 'Webinar';
                        const amountStr = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'N/A';
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: 'roberta@robertafernandez.com',
                            from_name: 'Your Mind Stylist',
                            subject: `💰 New Webinar Purchase: ${webinarName} — ${session.customer_details?.name || session.customer_email}`,
                            body: `<div style="font-family: Inter, sans-serif; max-width: 500px;"><h2 style="color: #1E3A32;">New Webinar Purchase</h2><p><strong>Customer:</strong> ${session.customer_details?.name || 'N/A'}</p><p><strong>Email:</strong> ${session.customer_email}</p><p><strong>Webinar:</strong> ${webinarName}</p><p><strong>Amount:</strong> ${amountStr}</p><p style="margin-top: 16px;"><a href="https://yourmindstylist.com/ClientsHub" style="color: #6E4F7D;">View in Clients Hub</a></p></div>`
                        });
                    } catch (notifErr) {
                        console.error('Manager webinar notification failed:', notifErr.message);
                    }
                }
                
                // Handle Gift Code Purchase (gift code redeemed)
                else if (session.metadata.gift_code && session.metadata.recipient_user_id) {
                    const giftCode = session.metadata.gift_code;
                    const recipientUserId = session.metadata.recipient_user_id;
                    const productId = session.metadata.product_id;
                    
                    const giftCodes = await base44.asServiceRole.entities.GiftCode.filter({ code: giftCode });
                    const giftCodeRecord = giftCodes[0];
                    
                    if (giftCodeRecord) {
                        await base44.asServiceRole.entities.GiftCode.update(giftCodeRecord.id, {
                            times_used: (giftCodeRecord.times_used || 0) + 1,
                            is_active: giftCodeRecord.is_single_use ? false : giftCodeRecord.is_active
                        });
                        
                        const product = await base44.asServiceRole.entities.Product.get(productId);
                        if (product) {
                            const courseIds = new Set();
                            if (product.related_course_id) courseIds.add(product.related_course_id);
                            if (product.access_grants?.length > 0) product.access_grants.forEach(id => courseIds.add(id));
                            
                            for (const courseId of courseIds) {
                                const existing = await base44.asServiceRole.entities.UserCourseProgress.filter({
                                    user_id: recipientUserId,
                                    course_id: courseId
                                });
                                if (existing.length === 0) {
                                    await base44.asServiceRole.entities.UserCourseProgress.create({
                                        user_id: recipientUserId,
                                        course_id: courseId,
                                        status: 'not_started',
                                        completion_percentage: 0
                                    });
                                }
                            }
                        }
                    }
                    return Response.json({ received: true });
                }
                
                // Handle Product Purchase (single product_id OR multi product_ids from cart)
                else if (session.metadata.product_id || session.metadata.product_ids) {
                    const productIdList = session.metadata.product_ids
                        ? session.metadata.product_ids.split(',').map(id => id.trim()).filter(Boolean)
                        : [session.metadata.product_id];

                    const userId = session.metadata.user_id && session.metadata.user_id.length > 0
                        ? session.metadata.user_id
                        : null;

                    // Consume gift code now that payment has actually succeeded
                    if (session.metadata.gift_code) {
                        try {
                            await consumeGiftCode(session.metadata.gift_code);
                        } catch (gcErr) {
                            console.error('Gift code consumption failed (non-critical):', gcErr.message);
                        }
                    }

                    // Fetch only the purchased products (avoid full-table scan)
                    const purchasedProducts = (await Promise.all(
                        productIdList.map(id => base44.asServiceRole.entities.Product.get(id).catch(() => null))
                    )).filter(Boolean);

                    const allCourseIds = new Set();
                    const productNames = [];

                    for (const product of purchasedProducts) {
                        productNames.push(product.name);

                        if (product.related_course_id) allCourseIds.add(product.related_course_id);
                        if (product.access_grants?.length > 0) product.access_grants.forEach(id => allCourseIds.add(id));

                        if (product.is_bundle && product.bundled_product_ids?.length > 0) {
                            const bundledProducts = (await Promise.all(
                                product.bundled_product_ids.map(id => base44.asServiceRole.entities.Product.get(id).catch(() => null))
                            )).filter(Boolean);
                            for (const bp of bundledProducts) {
                                if (bp.related_course_id) allCourseIds.add(bp.related_course_id);
                                if (bp.access_grants?.length > 0) bp.access_grants.forEach(id => allCourseIds.add(id));
                            }
                        }

                        // Auto-tag only for authenticated users
                        if (userId) {
                            try {
                                await base44.asServiceRole.functions.invoke('autoTagUser', {
                                    user_id: userId,
                                    product_key: product.key
                                });
                            } catch (tagError) {
                                console.error('Auto-tagging failed:', tagError);
                            }
                        }
                    }

                    // Course enrollment only for authenticated users
                    if (userId) {
                        for (const courseId of allCourseIds) {
                            const existing = await base44.asServiceRole.entities.UserCourseProgress.filter({
                                user_id: userId,
                                course_id: courseId
                            });
                            if (existing.length === 0) {
                                await base44.asServiceRole.entities.UserCourseProgress.create({
                                    user_id: userId,
                                    course_id: courseId,
                                    status: 'not_started',
                                    completion_percentage: 0
                                });
                            }
                        }
                    }

                    const combinedProductName = productNames.join(', ');
                    const today = new Date().toISOString().split('T')[0];

                    // Record purchased product IDs on the user for direct ownership checks
                    if (userId) {
                        try {
                            const userRecord = await base44.asServiceRole.entities.User.get(userId);
                            const existingIds = userRecord?.purchased_product_ids || [];
                            const newIds = [...new Set([...existingIds, ...productIdList])];
                            await base44.asServiceRole.entities.User.update(userId, {
                                purchased_product_ids: newIds
                            });
                        } catch (ownershipError) {
                            console.error('Failed to record product ownership (non-critical):', ownershipError.message);
                        }
                    }

                    // Add to CRM as lead with customer details
                    try {
                        const customerInfo = extractCustomerDetails(session);
                        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email: session.customer_email });
                        if (existingLeads.length > 0) {
                            const existing = existingLeads[0];
                            const boughtHistory = existing.what_they_bought
                                ? `${existing.what_they_bought}, ${combinedProductName}`
                                : combinedProductName;
                            await base44.asServiceRole.entities.Lead.update(existing.id, {
                                last_activity_date: new Date().toISOString(),
                                what_they_bought: boughtHistory,
                                date_of_purchase: today,
                                stage: 'won',
                                converted_to_client: true,
                                converted_date: new Date().toISOString(),
                                notes: `${existing.notes || ''}\n[${new Date().toLocaleDateString()}] Purchased: ${combinedProductName}`.trim(),
                                ...customerInfo,
                            });
                        } else {
                            const nameParts = (session.customer_details?.name || '').split(' ');
                            await base44.asServiceRole.entities.Lead.create({
                                full_name: session.customer_details?.name || '',
                                first_name: nameParts[0] || '',
                                last_name: nameParts.slice(1).join(' ') || '',
                                email: session.customer_email,
                                stage: 'won',
                                source: 'product_purchase',
                                interest_level: 'hot',
                                lead_score: 80,
                                converted_to_client: true,
                                converted_date: new Date().toISOString(),
                                what_they_bought: combinedProductName,
                                date_of_purchase: today,
                                last_activity_date: new Date().toISOString(),
                                notes: `Purchased: ${combinedProductName}`,
                                ...customerInfo,
                            });
                        }
                    } catch (crmError) {
                        console.error('Failed to add to CRM (non-critical):', crmError.message);
                    }

                    // Send purchase confirmation email
                    const hasPocketMindset = purchasedProducts.some(p => p.key === 'pocket-mindset' || p.slug === 'pocket-mindset');
                    const hasDigitalBook = purchasedProducts.some(p => p.product_subtype === 'book');
                    
                    if (hasPocketMindset && purchasedProducts.length === 1) {
                        await base44.asServiceRole.functions.invoke('sendTemplatedEmail', {
                            template_key: 'pocket_mindset_purchase',
                            recipient: session.customer_email,
                            variables: {
                                customer_name: session.customer_details?.name || 'there',
                                access_code: '935384',
                                current_year: new Date().getFullYear().toString()
                            }
                        });
                    } else if (hasDigitalBook) {
                        // Rich branded email for book purchases with clear download instructions
                        const bookNames = purchasedProducts.filter(p => p.product_subtype === 'book').map(p => p.name);
                        const otherNames = purchasedProducts.filter(p => p.product_subtype !== 'book').map(p => p.name);
                        const customerName = session.customer_details?.name || 'there';
                        
                        let itemsList = bookNames.map(n => `<li style="margin-bottom: 8px;">${n}</li>`).join('');
                        if (otherNames.length > 0) {
                            itemsList += otherNames.map(n => `<li style="margin-bottom: 8px;">${n}</li>`).join('');
                        }

                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: session.customer_email,
                            subject: `Your purchase is confirmed — ${combinedProductName}`,
                            body: `
                                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h1 style="font-family: 'Playfair Display', serif; color: #1E3A32; font-size: 28px; margin-bottom: 16px;">
                                        Thank you, ${customerName}!
                                    </h1>
                                    
                                    <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                        Your purchase has been confirmed. Here's what you ordered:
                                    </p>
                                    
                                    <div style="background: #F9F5EF; padding: 24px; margin: 24px 0; border-left: 4px solid #D8B46B;">
                                        <p style="color: #1E3A32; font-size: 16px; margin: 0 0 12px 0;">
                                            <strong>Your Purchase:</strong>
                                        </p>
                                        <ul style="color: #2B2725; margin: 0; padding-left: 20px;">
                                            ${itemsList}
                                        </ul>
                                    </div>
                                    
                                    <h2 style="font-family: 'Playfair Display', serif; color: #1E3A32; font-size: 22px; margin: 32px 0 16px;">
                                        How to Access Your Content
                                    </h2>
                                    
                                    <div style="margin-bottom: 24px;">
                                        <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
                                            <strong>Step 1:</strong> Log in to your account at yourmindstylist.com
                                        </p>
                                        <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
                                            <strong>Step 2:</strong> Go to your <strong>Client Portal</strong> — you'll find your purchased content in the <strong>My Library</strong> tab
                                        </p>
                                        <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
                                            <strong>Step 3:</strong> For downloadable files (digital books, PDFs), visit the <strong>Resources</strong> page to download your files
                                        </p>
                                    </div>
                                    
                                    <div style="text-align: center; margin: 32px 0;">
                                        <a href="https://yourmindstylist.com/login" 
                                           style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 16px 32px; text-decoration: none; font-weight: 500; letter-spacing: 0.5px;">
                                            LOG IN TO YOUR ACCOUNT
                                        </a>
                                    </div>
                                    
                                    <p style="color: #2B2725; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                                        If you have any questions or need help accessing your content, simply reply to this email or reach out at roberta@yourmindstylist.com.
                                    </p>
                                    
                                    <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                                        Enjoy your reading,<br>
                                        <strong>Roberta Fernandez</strong><br>
                                        <span style="color: #D8B46B;">Your Mind Stylist</span>
                                    </p>
                                </div>
                            `
                        });
                    } else {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: session.customer_email,
                            subject: `Welcome to ${combinedProductName}`,
                            body: `
                                <h2>Your purchase is confirmed!</h2>
                                <p>Thank you for purchasing ${combinedProductName}.</p>
                                <p>You now have access to all included content.</p>
                                <p>Log in to your dashboard to get started: https://yourmindstylist.com/login</p>
                                <br>
                                <p>Roberta Fernandez<br>Your Mind Stylist</p>
                            `
                        });
                    }

                    // --- MANAGER PURCHASE NOTIFICATION ---
                    try {
                        const customerName = session.customer_details?.name || session.customer_email;
                        const amountStr = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'N/A';
                        const purchaseDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        const isPhysical = session.metadata?.has_physical === 'true';
                        const customerInfo = extractCustomerDetails(session);
                        
                        let shippingBlock = '';
                        if (isPhysical && (customerInfo.address_line1 || customerInfo.city)) {
                            const addrLines = [
                                customerInfo.address_line1,
                                customerInfo.address_line2,
                                [customerInfo.city, customerInfo.state, customerInfo.zip].filter(Boolean).join(', '),
                                customerInfo.country && customerInfo.country !== 'US' ? customerInfo.country : null
                            ].filter(Boolean);
                            shippingBlock = `
                                <tr>
                                    <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Shipping Address</td>
                                    <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${addrLines.join('<br>')}</td>
                                </tr>`;
                        }

                        const phoneBlock = (customerInfo.phone || session.customer_details?.phone) 
                            ? `<tr><td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Phone</td><td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${customerInfo.phone || session.customer_details?.phone}</td></tr>` 
                            : '';

                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: 'roberta@robertafernandez.com',
                            from_name: 'Your Mind Stylist',
                            subject: `💰 New Purchase: ${combinedProductName} — ${customerName}`,
                            body: `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
                                <div style="background: #1E3A32; padding: 24px; text-align: center;">
                                    <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 22px; margin: 0;">New Purchase Notification</h1>
                                </div>
                                <div style="padding: 24px;">
                                    <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #E4D9C4; border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Customer</td>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${customerName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Email</td>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${session.customer_email}</td>
                                        </tr>
                                        ${phoneBlock}
                                        <tr>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Product</td>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${combinedProductName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Amount</td>
                                            <td style="padding: 8px 16px; color: #1E3A32; font-size: 14px; font-weight: 600; border-bottom: 1px solid #E4D9C4;">${amountStr}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Date</td>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${purchaseDate}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4; font-weight: 600;">Delivery</td>
                                            <td style="padding: 8px 16px; color: #2B2725; font-size: 14px; border-bottom: 1px solid #E4D9C4;">${isPhysical ? '📦 Physical — needs shipping' : '💻 Digital — instant access'}</td>
                                        </tr>
                                        ${shippingBlock}
                                    </table>
                                    <div style="text-align: center; margin-top: 24px;">
                                        <a href="https://yourmindstylist.com/ClientsHub" style="display: inline-block; background: #6E4F7D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">View in Clients Hub</a>
                                    </div>
                                </div>
                                <div style="text-align: center; padding: 16px; color: #2B2725; opacity: 0.4; font-size: 11px;">
                                    Automated notification from Your Mind Stylist
                                </div>
                            </div>`
                        });
                    } catch (notifError) {
                        console.error('Manager purchase notification failed (non-critical):', notifError.message);
                    }
                }
                
                // Handle Subscription Start (e.g., Pocket Visualization)
                else if (session.mode === 'subscription' && session.subscription) {
                    const userId = session.metadata.user_id;
                    if (userId) {
                        await base44.asServiceRole.entities.User.update(userId, {
                            stripe_customer_id: session.customer,
                            stripe_subscription_id: session.subscription,
                            subscription_status: 'active'
                        });

                        try {
                            await base44.asServiceRole.functions.invoke('autoTagUser', {
                                user_id: userId,
                                product_key: 'pocket-visualization'
                            });
                        } catch (tagError) {
                            console.error('Auto-tagging failed:', tagError);
                        }

                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: session.customer_email,
                            subject: 'Subscription Activated',
                            body: `
                                <h2>Your subscription is now active!</h2>
                                <p>Thank you for subscribing. You now have full access to all subscription features.</p>
                                <p>Log in to get started: https://yourmindstylist.com/login</p>
                                <br>
                                <p>Roberta Fernandez<br>Your Mind Stylist</p>
                            `
                        });
                    }
                }
                
                // Handle Masterclass Signup (free access)
                else if (session.metadata.type === 'masterclass_signup' && session.metadata.user_id) {
                    await base44.asServiceRole.entities.User.update(session.metadata.user_id, {
                        needs_masterclass_onboarding: true,
                        masterclass_signup_date: new Date().toISOString()
                    });

                    try {
                        await base44.asServiceRole.functions.invoke('autoTagUser', {
                            user_id: session.metadata.user_id,
                            event_type: 'masterclass_signup'
                        });
                    } catch (tagError) {
                        console.error('Auto-tagging failed:', tagError);
                    }

                    // Add to CRM as lead
                    try {
                        const existingLeads = await base44.asServiceRole.entities.Lead.filter({
                            email: session.customer_email
                        });

                        if (existingLeads.length > 0) {
                            await base44.asServiceRole.entities.Lead.update(existingLeads[0].id, {
                                last_activity_date: new Date().toISOString(),
                                notes: `${existingLeads[0].notes || ''}\n[${new Date().toLocaleDateString()}] Signed up for free masterclass`
                            });
                        } else {
                            const nameParts = (session.customer_details?.name || '').split(' ');
                            await base44.asServiceRole.entities.Lead.create({
                                first_name: nameParts[0] || '',
                                last_name: nameParts.slice(1).join(' ') || '',
                                email: session.customer_email,
                                stage: 'new',
                                source: 'free_masterclass',
                                last_activity_date: new Date().toISOString(),
                                notes: 'Signed up for free masterclass'
                            });
                        }
                    } catch (crmError) {
                        console.error('Failed to add to CRM (non-critical):', crmError.message);
                    }

                    // Send welcome email with masterclass access
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: session.customer_email,
                        subject: 'Welcome! Your Masterclass Is Ready',
                        body: `
                            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="font-family: 'Playfair Display', serif; color: #1E3A32; font-size: 32px; margin-bottom: 16px;">Welcome to Your Mind Stylist</h1>
                                
                                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                    Thank you for signing up for the <strong>Imposter Syndrome & Other Myths to Ditch</strong> masterclass.
                                </p>
                                
                                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                    Your masterclass is now available in your personal dashboard. You can watch it anytime, pause, rewatch sections, and take notes as you go.
                                </p>
                                
                                <div style="background: #F9F5EF; padding: 24px; margin: 24px 0; border-left: 4px solid #D8B46B;">
                                    <p style="color: #1E3A32; font-size: 16px; margin: 0;">
                                        <strong>What's included:</strong>
                                    </p>
                                    <ul style="color: #2B2725; margin-top: 12px;">
                                        <li>Full masterclass video (on-demand)</li>
                                        <li>Your Mind Styling Studio™ dashboard</li>
                                        <li>Progress tracking and notes</li>
                                        <li>Access to Style Pauses™</li>
                                    </ul>
                                </div>
                                
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="https://yourmindstylist.com/login?from_masterclass=true" 
                                       style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 16px 32px; text-decoration: none; font-weight: 500; letter-spacing: 0.5px;">
                                        ACCESS YOUR DASHBOARD
                                    </a>
                                </div>
                                
                                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                    If the masterclass resonates with you, I'd love to continue supporting your work. You'll find information about private coaching, certification training, and group programs inside your dashboard.
                                </p>
                                
                                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                                    Welcome aboard,<br>
                                    <strong>Roberta Fernandez</strong><br>
                                    <span style="color: #D8B46B;">Your Mind Stylist</span>
                                </p>
                            </div>
                        `
                    });
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                
                const users = await base44.asServiceRole.entities.User.filter({ 
                    stripe_subscription_id: subscription.id 
                });
                
                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_status: subscription.status
                    });
                    
                    if (subscription.metadata.payment_plan === 'true' && subscription.cancel_at) {
                        const monthsRemaining = Math.ceil((subscription.cancel_at * 1000 - Date.now()) / (30 * 24 * 60 * 60 * 1000));
                        
                        if (monthsRemaining === 1) {
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: users[0].email,
                                subject: 'Final Payment Plan Installment',
                                body: `
                                    <h2>Final Payment Coming Up</h2>
                                    <p>This is your last payment installment for ${subscription.metadata.plan_name}.</p>
                                    <p>After this payment, your plan will be complete and you'll retain full access to all content.</p>
                                    <br>
                                    <p>Roberta Fernandez<br>Your Mind Stylist</p>
                                `
                            });
                        }
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                
                const users = await base44.asServiceRole.entities.User.filter({ 
                    stripe_subscription_id: subscription.id 
                });
                
                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_status: 'cancelled'
                    });

                    if (subscription.metadata.payment_plan === 'true') {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: users[0].email,
                            subject: 'Payment Plan Complete!',
                            body: `
                                <h2>Congratulations! Your payment plan is complete</h2>
                                <p>You've successfully completed all ${subscription.metadata.total_months} installments for ${subscription.metadata.plan_name}.</p>
                                <p>You now have permanent access to all included content and materials.</p>
                                <p>Thank you for your commitment to your growth.</p>
                                <br>
                                <p>Roberta Fernandez<br>Your Mind Stylist</p>
                            `
                        });
                    } else {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: users[0].email,
                            subject: 'Subscription Cancelled',
                            body: `
                                <h2>Your subscription has been cancelled</h2>
                                <p>We're sorry to see you go. Your access will remain active until the end of your billing period.</p>
                                <p>You can reactivate anytime from your dashboard.</p>
                                <br>
                                <p>Roberta Fernandez<br>Your Mind Stylist</p>
                            `
                        });
                    }
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                console.log('Invoice paid:', invoice.id);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const users = await base44.asServiceRole.entities.User.filter({ 
                    stripe_customer_id: invoice.customer 
                });
                
                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_status: 'past_due'
                    });

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: users[0].email,
                        subject: 'Payment Issue - Action Required',
                        body: `
                            <h2>We couldn't process your payment</h2>
                            <p>There was an issue processing your subscription payment.</p>
                            <p>Please update your payment method to continue your access.</p>
                            <p>Manage your subscription: https://yourmindstylist.com/dashboard</p>
                            <br>
                            <p>Roberta Fernandez<br>Your Mind Stylist</p>
                        `
                    });
                }
                break;
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});