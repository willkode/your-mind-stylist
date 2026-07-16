import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { booking_id } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'booking_id required' }, { status: 400 });
        }

        // Use service role to fetch booking details (no auth required)
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });

        if (bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        return Response.json({ booking: bookings[0] });

    } catch (error) {
        console.error('Get booking error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});