import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get waiting entries, sorted by priority
    const waitingEntries = await base44.asServiceRole.entities.WaitingList.filter({
      status: 'waiting'
    });

    // Sort by priority score (highest first)
    const sortedEntries = waitingEntries.sort((a, b) => 
      (b.priority_score || 0) - (a.priority_score || 0)
    );

    const matches = [];
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const entry of sortedEntries) {
      try {
        // Get available slots
        const slotsResponse = await base44.asServiceRole.functions.invoke('getAvailableSlots', {
          start_date: now.toISOString().split('T')[0],
          end_date: sevenDaysOut.toISOString().split('T')[0],
          service_type: entry.service_type
        });

        if (!slotsResponse.data || !slotsResponse.data.slots || slotsResponse.data.slots.length === 0) {
          continue;
        }

        const slots = slotsResponse.data.slots;

        // Find best matching slot based on preferences
        let bestSlot = null;

        // Check preferred dates first
        if (entry.preferred_dates && entry.preferred_dates.length > 0) {
          for (const prefDate of entry.preferred_dates) {
            const matchingSlot = slots.find(s => s.date === prefDate);
            if (matchingSlot) {
              bestSlot = matchingSlot;
              break;
            }
          }
        }

        // If no preferred date match and flexible, take first available
        if (!bestSlot && entry.flexible && slots.length > 0) {
          bestSlot = slots[0];
        }

        if (bestSlot) {
          // Update waitlist entry
          await base44.asServiceRole.entities.WaitingList.update(entry.id, {
            status: 'matched',
            matched_date: new Date().toISOString(),
            matched_slot: {
              date: bestSlot.date,
              time: bestSlot.time,
              staff_id: bestSlot.staff_id
            },
            auto_match_attempts: (entry.auto_match_attempts || 0) + 1,
            last_auto_match: new Date().toISOString()
          });

          // Send notification email
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: entry.user_email,
              subject: 'We Found You a Spot!',
              body: `Hi ${entry.user_name},\n\nGreat news! We found an available appointment slot that matches your preferences:\n\nDate: ${bestSlot.date}\nTime: ${bestSlot.time}\n\nPlease log in to your account to confirm this booking.\n\nBest regards,\nYour Mind Stylist Team`
            });
          } catch (emailError) {
            console.error('Email notification error:', emailError);
          }

          matches.push({
            waitlist_id: entry.id,
            user_email: entry.user_email,
            matched_slot: bestSlot
          });
        } else {
          // Update attempt count
          await base44.asServiceRole.entities.WaitingList.update(entry.id, {
            auto_match_attempts: (entry.auto_match_attempts || 0) + 1,
            last_auto_match: new Date().toISOString()
          });
        }
      } catch (entryError) {
        console.error(`Error matching entry ${entry.id}:`, entryError);
      }
    }

    return Response.json({
      success: true,
      total_processed: sortedEntries.length,
      matches_found: matches.length,
      matches
    });

  } catch (error) {
    console.error('Auto-match error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});