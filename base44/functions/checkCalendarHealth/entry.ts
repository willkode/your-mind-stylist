import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ROBERTA_EMAIL = 'roberta@robertafernandez.com';
const FAILURE_THRESHOLD = 2; // Alert after this many consecutive failures

Deno.serve(async (req) => {
  const startTime = Date.now();
  const base44 = createClientFromRequest(req);

  // Allow both admin and scheduled automation calls
  // (scheduled automations run as admin context)

  let connectionStatus = 'unknown';
  let errorMessage = null;
  let errorType = null;
  let calendarsFound = [];

  // Step 1: Test the Google Calendar connection
  try {
    const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const accessToken = conn.accessToken;

    // Test with a lightweight calendar list call
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=5',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (calListRes.status === 401 || calListRes.status === 403) {
      connectionStatus = 'failure';
      errorMessage = `Google Calendar returned ${calListRes.status} — token is expired or revoked.`;
      errorType = 'auth_expired';
    } else if (!calListRes.ok) {
      connectionStatus = 'failure';
      const errText = await calListRes.text();
      errorMessage = `Google Calendar API error ${calListRes.status}: ${errText.substring(0, 200)}`;
      errorType = 'api_error';
    } else {
      const calData = await calListRes.json();
      calendarsFound = (calData.items || []).map(c => c.summary || c.id);
      connectionStatus = 'success';
    }
  } catch (err) {
    connectionStatus = 'failure';
    errorMessage = err.message || 'Unknown connector error';
    errorType = err.message?.includes('not connected') || err.message?.includes('not authorized')
      ? 'auth_expired'
      : 'network';
  }

  // Step 2: Count consecutive failures from recent logs
  let consecutiveFailures = 0;
  try {
    const recentLogs = await base44.asServiceRole.entities.CalendarSyncLog.list('-created_date', 10);
    for (const log of recentLogs) {
      if (log.status === 'failure') {
        consecutiveFailures++;
      } else {
        break; // Stop counting at first success
      }
    }
  } catch (e) {
    // First run — no logs yet
  }

  // If this check also failed, increment
  if (connectionStatus === 'failure') {
    consecutiveFailures++;
  } else {
    consecutiveFailures = 0;
  }

  // Step 3: Log this health check
  const logEntry = {
    sync_type: 'health_check',
    status: connectionStatus,
    calendars_synced: calendarsFound,
    events_found: 0,
    rules_created: 0,
    rules_deleted: 0,
    error_message: errorMessage,
    error_type: errorType,
    consecutive_failures: consecutiveFailures,
    alert_sent: false,
    duration_ms: Date.now() - startTime
  };

  // Step 4: Send alert email if threshold exceeded
  let alertSent = false;
  if (connectionStatus === 'failure' && consecutiveFailures >= FAILURE_THRESHOLD) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ROBERTA_EMAIL,
        from_name: 'Your Mind Stylist — System Alert',
        subject: '⚠️ Google Calendar Connection Needs Attention',
        body: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #FEF3CD; border-left: 4px solid #D8B46B; padding: 16px; margin-bottom: 24px;">
              <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #1E3A32; margin: 0 0 8px 0;">
                Calendar Sync Alert
              </h2>
              <p style="color: #2B2725; margin: 0; font-size: 14px;">
                Google Calendar has failed to connect <strong>${consecutiveFailures} times in a row</strong>.
              </p>
            </div>
            
            <p style="color: #2B2725; font-size: 14px; line-height: 1.6;">
              Your booking calendar may not be showing your latest availability. 
              New events added to Google Calendar won't appear on the website until this is fixed.
            </p>
            
            <p style="color: #2B2725; font-size: 14px; line-height: 1.6;">
              <strong>What happened:</strong> ${errorMessage || 'Connection to Google Calendar was lost.'}
            </p>
            
            <p style="color: #2B2725; font-size: 14px; line-height: 1.6;">
              <strong>What to do:</strong> Please contact Indy to reconnect your Google Calendar. 
              This is usually a quick fix — Google periodically requires re-authorization of connected apps.
            </p>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E4D9C4;">
              <p style="color: #2B2725/60; font-size: 12px;">
                This is an automated system health alert from Your Mind Stylist.
              </p>
            </div>
          </div>
        `
      });
      alertSent = true;
      console.log(`Alert email sent to ${ROBERTA_EMAIL} — ${consecutiveFailures} consecutive failures`);
    } catch (emailErr) {
      console.error('Failed to send alert email:', emailErr.message);
    }
  }

  logEntry.alert_sent = alertSent;

  // Save log
  try {
    await base44.asServiceRole.entities.CalendarSyncLog.create(logEntry);
  } catch (e) {
    console.error('Failed to save sync log:', e.message);
  }

  // Step 5: Return status
  return Response.json({
    connected: connectionStatus === 'success',
    status: connectionStatus,
    calendars: calendarsFound,
    consecutive_failures: consecutiveFailures,
    alert_sent: alertSent,
    error: errorMessage,
    error_type: errorType,
    checked_at: new Date().toISOString(),
    duration_ms: Date.now() - startTime
  });
});