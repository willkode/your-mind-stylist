import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scheduled_date } = await req.json();

        if (!scheduled_date) {
            return Response.json({ error: 'scheduled_date is required' }, { status: 400 });
        }

        const targetDate = new Date(scheduled_date);
        const now = new Date();

        // Get all bookings for this time slot
        const bookings = await base44.asServiceRole.entities.Booking.filter({
            scheduled_date
        });

        // Check if any active bookings exist (confirmed, scheduled, or pending within expiry)
        const activeBookings = bookings.filter(booking => {
            // Confirmed or scheduled bookings block the slot
            if (['confirmed', 'scheduled'].includes(booking.booking_status)) {
                return true;
            }

            // Pending bookings only block if not expired
            if (booking.booking_status === 'pending_payment' && booking.checkout_expires_at) {
                return new Date(booking.checkout_expires_at) > now;
            }

            return false;
        });

        return Response.json({
            available: activeBookings.length === 0,
            scheduled_date,
            active_bookings_count: activeBookings.length,
            reason: activeBookings.length > 0 
                ? 'Time slot is held or booked' 
                : 'Time slot is available'
        });

    } catch (error) {
        console.error('checkSlotAvailability error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});