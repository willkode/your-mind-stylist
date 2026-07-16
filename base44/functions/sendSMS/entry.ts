import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { to, message, booking_id, lead_id } = await req.json();

        if (!to || !message) {
            return Response.json({ error: 'to and message required' }, { status: 400 });
        }

        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (!accountSid || !authToken || !fromNumber) {
            return Response.json({ 
                error: 'Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Settings.' 
            }, { status: 500 });
        }

        // Format phone number
        let phoneNumber = to.replace(/\D/g, '');
        if (!phoneNumber.startsWith('1') && phoneNumber.length === 10) {
            phoneNumber = '1' + phoneNumber;
        }
        phoneNumber = '+' + phoneNumber;

        // Send SMS via Twilio REST API
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = btoa(`${accountSid}:${authToken}`);

        const body = new URLSearchParams({
            To: phoneNumber,
            From: fromNumber,
            Body: message
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Twilio error:', result);
            return Response.json({ 
                error: result.message || 'Failed to send SMS' 
            }, { status: response.status });
        }

        // Log activity if related to booking or lead
        if (booking_id) {
            try {
                const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
                if (bookings.length > 0) {
                    await base44.asServiceRole.entities.Booking.update(booking_id, {
                        sms_reminder_sent: true,
                        last_reminder_sent: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error('Failed to update booking:', err);
            }
        }

        if (lead_id) {
            try {
                await base44.asServiceRole.entities.LeadActivity.create({
                    lead_id,
                    activity_type: 'sms_sent',
                    description: `SMS sent: ${message.substring(0, 50)}...`,
                    created_by: user.email
                });
            } catch (err) {
                console.error('Failed to log lead activity:', err);
            }
        }

        return Response.json({
            success: true,
            sid: result.sid,
            status: result.status,
            to: phoneNumber
        });

    } catch (error) {
        console.error('Send SMS error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});