import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { waitlist_id } = await req.json();

    // Get waitlist entry
    const entries = await base44.asServiceRole.entities.WaitingList.filter({ id: waitlist_id });
    if (!entries || entries.length === 0) {
      return Response.json({ error: 'Waitlist entry not found' }, { status: 404 });
    }

    const entry = entries[0];

    // Calculate priority score (0-100)
    let score = 0;
    const factors = {};

    // 1. Wait time (max 40 points) - longer wait = higher priority
    const requestDate = new Date(entry.requested_date || entry.created_date);
    const waitTimeDays = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
    factors.wait_time_days = waitTimeDays;
    score += Math.min(40, waitTimeDays * 2); // 2 points per day, max 40

    // 2. Urgency level (max 30 points)
    const urgencyMap = { low: 0, medium: 10, high: 20, urgent: 30 };
    factors.urgency_level = entry.urgency_level || 'medium';
    score += urgencyMap[factors.urgency_level];

    // 3. Flexibility (max 15 points) - flexible clients get bonus
    factors.flexibility_score = entry.flexible ? 15 : 5;
    score += factors.flexibility_score;

    // 4. Client value (max 15 points) - based on past bookings
    const pastBookings = await base44.asServiceRole.entities.Booking.filter({
      user_email: entry.user_email,
      booking_status: 'completed'
    });
    factors.client_value_score = Math.min(15, pastBookings.length * 3); // 3 points per completed booking
    score += factors.client_value_score;

    // Update waitlist entry
    await base44.asServiceRole.entities.WaitingList.update(entry.id, {
      priority_score: Math.round(score),
      priority_factors: factors
    });

    return Response.json({
      success: true,
      priority_score: Math.round(score),
      factors
    });

  } catch (error) {
    console.error('Calculate priority error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});