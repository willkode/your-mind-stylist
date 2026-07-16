import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, reason } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // Fetch the booking
        const bookings = await base44.entities.Booking.filter({ id: booking_id });
        if (bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookings[0];

        // Verify user owns this booking or is admin/manager
        if (booking.user_email !== user.email && !['admin', 'manager'].includes(user.role)) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if booking can be cancelled
        if (['cancelled', 'completed', 'expired'].includes(booking.booking_status)) {
            return Response.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
        }

        // Calculate if eligible for refund (e.g., cancelled more than 24 hours before)
        let refundIssued = false;
        let refundAmount = 0;

        if (booking.payment_status === 'paid' && booking.stripe_payment_intent_id) {
            const now = new Date();
            const scheduledDate = booking.scheduled_date ? new Date(booking.scheduled_date) : null;
            const hoursUntilSession = scheduledDate ? (scheduledDate - now) / (1000 * 60 * 60) : 999;

            // Refund policy: full refund if cancelled 24+ hours before, 50% if 24 hours or less
            let refundPercentage = 0;
            if (hoursUntilSession >= 24) {
                refundPercentage = 100;
            } else if (hoursUntilSession > 0) {
                refundPercentage = 50;
            }

            if (refundPercentage > 0) {
                refundAmount = Math.round((booking.amount * refundPercentage) / 100);
                
                try {
                    await stripe.refunds.create({
                        payment_intent: booking.stripe_payment_intent_id,
                        amount: refundAmount,
                        reason: 'requested_by_customer',
                    });
                    refundIssued = true;
                } catch (error) {
                    console.error('Stripe refund error:', error);
                }
            }
        }

        // Update booking status
        await base44.entities.Booking.update(booking_id, {
            booking_status: 'cancelled',
            payment_status: refundIssued ? 'refunded' : booking.payment_status,
            notes: booking.notes ? `${booking.notes}\n\nCancellation reason: ${reason || 'Not provided'}` : `Cancellation reason: ${reason || 'Not provided'}`
        });

        // Send notification to client
        await base44.integrations.Core.SendEmail({
            to: booking.user_email,
            subject: 'Booking Cancellation Confirmed',
            body: generateCancellationEmail(booking, refundIssued, refundAmount)
        });

        // Send notification to manager
        await base44.integrations.Core.SendEmail({
            to: 'roberta@robertafernandez.com',
            subject: `Booking Cancelled: ${booking.user_name}`,
            body: generateManagerCancellationEmail(booking, refundIssued, refundAmount, reason)
        });

        return Response.json({
            success: true,
            booking_id: booking_id,
            refund_issued: refundIssued,
            refund_amount: refundAmount,
            message: refundIssued ? `Your booking has been cancelled and a ${refundAmount === booking.amount ? 'full' : 'partial'} refund has been processed.` : 'Your booking has been cancelled.'
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateCancellationEmail(booking, refundIssued, refundAmount) {
    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount / 100);
    };

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Booking Cancelled
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hi ${booking.user_name},
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Your booking for <strong>${booking.service_type?.replace(/_/g, ' ')}</strong> has been cancelled.
                </p>
                
                ${refundIssued ? `
                    <div style="background-color: #E8F4FD; border: 2px solid #2D8CFF; padding: 20px; margin: 20px 0;">
                        <p style="color: #1E3A32; font-weight: 600; margin: 0 0 10px 0;">💳 Refund Processed</p>
                        <p style="margin: 0; color: #2B2725;">
                            Amount: ${formatAmount(refundAmount)}<br/>
                            The refund will appear in your account within 5-10 business days.
                        </p>
                    </div>
                ` : ''}
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    If you'd like to reschedule or have any questions, please don't hesitate to reach out.
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                    Roberta Fernandez<br />
                    <span style="color: #D8B46B; font-size: 14px;">Your Mind Stylist</span>
                </p>
            </div>
            
            <div style="background-color: #F9F5EF; padding: 30px 20px; text-align: center; border-top: 1px solid #E4D9C4;">
                <p style="color: #2B2725; font-size: 12px; opacity: 0.6; margin: 0;">
                    © ${new Date().getFullYear()} Your Mind Stylist. All rights reserved.
                </p>
            </div>
        </div>
    `;
}

function generateManagerCancellationEmail(booking, refundIssued, refundAmount, reason) {
    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount / 100);
    };

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Booking Cancelled
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    <strong>${booking.user_name}</strong> has cancelled their booking.
                </p>
                
                <div style="background-color: #F9F5EF; padding: 20px; margin: 20px 0;">
                    <p><strong>Service:</strong> ${booking.service_type?.replace(/_/g, ' ')}</p>
                    <p><strong>Client:</strong> ${booking.user_name} (${booking.user_email})</p>
                    <p><strong>Amount:</strong> ${formatAmount(booking.amount)}</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
                
                ${refundIssued ? `
                    <div style="background-color: #E8F4FD; padding: 20px; margin: 20px 0;">
                        <p style="color: #1E3A32; font-weight: 600;">Refund Issued: ${formatAmount(refundAmount)}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}