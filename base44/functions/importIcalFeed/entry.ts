import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManager = user.role === 'admin' || user.role === 'manager' || user.custom_role === 'manager';
    if (!isManager) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ical_url } = await req.json();
    
    if (!ical_url) {
      return Response.json({ error: 'ical_url is required' }, { status: 400 });
    }

    // Convert webcal:// to https:// for proper fetching
    let fetchUrl = ical_url;
    if (ical_url.startsWith('webcal://')) {
      fetchUrl = ical_url.replace('webcal://', 'https://');
    }

    // Fetch iCal feed
    const feedRes = await fetch(fetchUrl);
    if (!feedRes.ok) {
      return Response.json({ error: 'Failed to fetch iCal feed' }, { status: 400 });
    }

    const icalText = await feedRes.text();

    // Parse iCal events (basic parser)
    const events = [];
    const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    let match;

    while ((match = eventRegex.exec(icalText)) !== null) {
      const eventText = match[1];
      
      // Extract key fields
      const summaryMatch = eventText.match(/SUMMARY:(.+?)(?:\r\n|$)/);
      const dtStartMatch = eventText.match(/DTSTART[^:]*:(.+?)(?:\r\n|$)/);
      const dtEndMatch = eventText.match(/DTEND[^:]*:(.+?)(?:\r\n|$)/);
      
      if (summaryMatch && dtStartMatch && dtEndMatch) {
        events.push({
          summary: summaryMatch[1].trim(),
          start: dtStartMatch[1].trim(),
          end: dtEndMatch[1].trim()
        });
      }
    }

    if (events.length === 0) {
      return Response.json({ error: 'No events found in iCal feed' }, { status: 400 });
    }

    // Get user's timezone
    const settingsRes = await base44.asServiceRole.entities.AvailabilitySettings.filter(
      { manager_id: user.id },
      '-created_date',
      1
    );
    const userTimezone = settingsRes.length > 0 ? settingsRes[0].timezone : 'America/Los_Angeles';

    // Helper functions
    const parseIcalDate = (dateStr) => {
      // Handle both DATE and DATETIME formats
      if (dateStr.length === 8) {
        // DATE format: YYYYMMDD
        return new Date(dateStr.slice(0, 4), parseInt(dateStr.slice(4, 6)) - 1, dateStr.slice(6, 8));
      } else {
        // DATETIME format: YYYYMMDDTHHMMSSZ or similar
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1;
        const day = parseInt(dateStr.slice(6, 8));
        const hour = parseInt(dateStr.slice(9, 11)) || 0;
        const minute = parseInt(dateStr.slice(11, 13)) || 0;
        const second = parseInt(dateStr.slice(13, 15)) || 0;
        
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      }
    };

    const formatTimeInTimezone = (date, timezone) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    };

    const getDateInTimezone = (date, timezone) => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(date);
    };

    // Create blocked rules for each event
    const rulesToCreate = [];
    for (const event of events) {
      const startDate = parseIcalDate(event.start);
      const endDate = parseIcalDate(event.end);

      rulesToCreate.push({
        manager_id: user.id,
        rule_type: 'blocked',
        specific_date: getDateInTimezone(startDate, userTimezone),
        start_time: formatTimeInTimezone(startDate, userTimezone),
        end_time: formatTimeInTimezone(endDate, userTimezone),
        is_available: false,
        reason: `Imported from Acuity: ${event.summary}`,
        source: 'calendar_sync',
        external_event_id: `acuity_${Date.now()}_${Math.random()}`,
        active: true
      });
    }

    // Bulk create rules
    if (rulesToCreate.length > 0) {
      await base44.asServiceRole.entities.AvailabilityRule.bulkCreate(rulesToCreate);
    }

    return Response.json({
      success: true,
      imported_events: rulesToCreate.length,
      message: `Imported ${rulesToCreate.length} events from Acuity as blocked times`
    });
  } catch (error) {
    console.error('iCal import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});