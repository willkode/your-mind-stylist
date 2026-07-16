import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated (manager/admin only)
        const user = await base44.auth.me();
        if (!user || (user.role !== 'admin' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date().toISOString();

        // Find all bookings with expired checkouts that are still pending
        const expiredBookings = await base44.asServiceRole.entities.Booking.filter({
            booking_status: 'pending_payment',
            payment_status: 'pending'
        });

        // Filter to only those that have actually expired
        const toExpire = expiredBookings.filter(booking => {
            if (!booking.checkout_expires_at) return false;
            return new Date(booking.checkout_expires_at) < new Date(now);
        });

        // Update each to expired status
        const results = await Promise.all(
            toExpire.map(booking =>
                base44.asServiceRole.entities.Booking.update(booking.id, {
                    booking_status: 'expired'
                })
            )
        );

        return Response.json({
            success: true,
            expired_count: results.length,
            expired_bookings: toExpire.map(b => ({
                id: b.id,
                user_name: b.user_name,
                scheduled_date: b.scheduled_date,
                expired_at: b.checkout_expires_at
            }))
        });

    } catch (error) {
        console.error('cleanupExpiredBookings error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});