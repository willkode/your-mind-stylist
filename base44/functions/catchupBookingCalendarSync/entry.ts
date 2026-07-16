import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Verify Google Calendar is connected before doing any work
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      console.log('[catchup] Google Calendar not connected — skipping entire run.');
      return Response.json({ success: true, message: 'Google Calendar not connected, skipping.', synced: 0, skipped: 0, failed: 0 });
    }

    if (!accessToken) {
      console.log('[catchup] No access token available — skipping entire run.');
      return Response.json({ success: true, message: 'No access token, skipping.', synced: 0, skipped: 0, failed: 0 });
    }

    // Find confirmed/scheduled bookings with no google_event_id
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const allConfirmed = await base44.asServiceRole.entities.Booking.filter(
      { booking_status: 'confirmed', google_event_id: null },
      '-scheduled_date',
      100
    );
    const allScheduled = await base44.asServiceRole.entities.Booking.filter(
      { booking_status: 'scheduled', google_event_id: null },
      '-scheduled_date',
      100
    );

    const candidates = [...allConfirmed, ...allScheduled];

    let synced = 0;
    let skipped = 0;
    let failed = 0;
    const results = [];

    for (const booking of candidates) {
      // Skip past bookings
      if (!booking.scheduled_date || new Date(booking.scheduled_date) < new Date(todayStart)) {
        console.log(`[catchup] SKIP past booking ${booking.id} (${booking.user_name}, ${booking.scheduled_date})`);
        results.push({ id: booking.id, name: booking.user_name, status: 'skipped_past' });
        skipped++;
        continue;
      }

      // Skip if missing required data
      if (!booking.user_name || !booking.user_email) {
        console.log(`[catchup] SKIP booking ${booking.id} — missing name or email`);
        results.push({ id: booking.id, status: 'skipped_missing_data' });
        skipped++;
        continue;
      }

      // Re-fetch to confirm google_event_id is still null (prevent duplicates)
      const freshBookings = await base44.asServiceRole.entities.Booking.filter({ id: booking.id });
      if (!freshBookings || freshBookings.length === 0) {
        console.log(`[catchup] SKIP booking ${booking.id} — not found on re-fetch`);
        skipped++;
        continue;
      }
      const fresh = freshBookings[0];
      if (fresh.google_event_id) {
        console.log(`[catchup] SKIP booking ${booking.id} — google_event_id already set on re-fetch`);
        results.push({ id: booking.id, name: booking.user_name, status: 'skipped_already_synced' });
        skipped++;
        continue;
      }

      // Attempt sync via the existing syncBookingToCalendar function
      try {
        const syncRes = await base44.asServiceRole.functions.invoke('syncBookingToCalendar', { booking_id: booking.id });
        const syncData = syncRes.data || syncRes;

        if (syncData.success && syncData.event_id) {
          console.log(`[catchup] SYNCED booking ${booking.id} (${booking.user_name}) → event ${syncData.event_id}`);
          results.push({ id: booking.id, name: booking.user_name, status: 'synced', event_id: syncData.event_id });
          synced++;
        } else {
          console.log(`[catchup] FAILED booking ${booking.id} (${booking.user_name}): ${syncData.message || syncData.error || 'unknown'}`);
          results.push({ id: booking.id, name: booking.user_name, status: 'failed', reason: syncData.message || syncData.error });
          failed++;
        }
      } catch (err) {
        console.error(`[catchup] ERROR syncing booking ${booking.id} (${booking.user_name}):`, err.message);
        results.push({ id: booking.id, name: booking.user_name, status: 'failed', reason: err.message });
        failed++;
      }
    }

    console.log(`[catchup] Complete — synced: ${synced}, skipped: ${skipped}, failed: ${failed}, total candidates: ${candidates.length}`);

    return Response.json({
      success: true,
      synced,
      skipped,
      failed,
      total_candidates: candidates.length,
      results,
    });
  } catch (error) {
    console.error('[catchup] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});