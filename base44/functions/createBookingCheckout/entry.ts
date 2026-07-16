import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { service_type, session_count, amount, notes, scheduled_date, appointment_type_id, staff_id, intake_data, affiliate_code, user_email, user_name } = payload;

        console.log('Received payload:', { user_email, user_name, amount, service_type });

        // For free consultations, allow unauthenticated bookings
        if (amount === 0) {
            if (!user_email || !user_name) {
                return Response.json({ 
                    error: 'Missing required fields: user_email and user_name are required for free consultations' 
                }, { status: 400 });
            }

            if (!appointment_type_id) {
                console.error('Missing appointment_type_id in payload:', payload);
                return Response.json({ 
                    error: 'Missing required field: appointment_type_id' 
                }, { status: 400 });
            }

            const bookingData = {
                user_email,
                user_name,
                staff_id,
                appointment_type_id,
                service_type,
                session_count: session_count || 1,
                amount: 0,
                currency: 'usd',
                payment_status: 'not_required',
                booking_status: 'confirmed',
                scheduled_date,
                notes,
                client_phone: intake_data?.phone,
                client_contact_preference: intake_data?.contact_preference
            };

            console.log('Creating booking with data:', bookingData);
            console.log('Appointment type ID being saved:', appointment_type_id);

            const booking = await base44.asServiceRole.entities.Booking.create(bookingData);
            console.log('Booking created successfully:', booking.id);
            console.log('Booking appointment_type_id after creation:', booking.appointment_type_id);

                // Get appointment type to check if Zoom should be auto-created
                const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({
                    id: appointment_type_id
                });
                console.log('Appointment type check:', { found: appointmentTypes.length, zoom_enabled: appointmentTypes[0]?.zoom_enabled });

                // Auto-create Zoom meeting if enabled for this appointment type
                if (appointmentTypes.length > 0 && appointmentTypes[0].zoom_enabled) {
                    try {
                        console.log('Creating Zoom meeting for booking:', booking.id);
                        const zoomResult = await base44.asServiceRole.functions.invoke('createZoomMeeting', {
                            booking_id: booking.id,
                            topic: `${service_type?.replace(/_/g, ' ')} - ${user_name}`,
                            start_time: scheduled_date,
                            duration: appointmentTypes[0].duration || 60
                        });
                        console.log('Zoom meeting created:', zoomResult.data);
                    } catch (zoomError) {
                        console.error('Failed to create Zoom meeting:', zoomError);
                        // Don't fail the booking if Zoom creation fails
                    }
                } else {
                    console.log('Zoom not enabled or appointment type not found');
                }

                // Send confirmation emails (don't let email failures block the booking)
                console.log('=== ATTEMPTING TO SEND CONFIRMATION EMAILS ===');
                console.log('Booking ID:', booking.id);
                console.log('User email:', user_email);

                try {
                    console.log('Invoking sendBookingEmail for client...');
                    const clientEmailResult = await base44.asServiceRole.functions.invoke('sendBookingEmail', {
                        booking_id: booking.id,
                        recipient_type: 'client'
                    });
                    console.log('✓ Client email sent successfully:', clientEmailResult.data);
                } catch (error) {
                    console.error('✗ FAILED to send client email:', error);
                    console.error('Error details:', error.message, error.stack);
                }

                try {
                    console.log('Invoking sendBookingEmail for manager...');
                    const managerEmailResult = await base44.asServiceRole.functions.invoke('sendBookingEmail', {
                        booking_id: booking.id,
                        recipient_type: 'manager'
                    });
                    console.log('✓ Manager email sent successfully:', managerEmailResult.data);
                } catch (error) {
                    console.error('✗ FAILED to send manager email:', error);
                    console.error('Error details:', error.message, error.stack);
                }

                console.log('=== EMAIL SENDING PROCESS COMPLETE ===');



                // Add to CRM as lead
                try {
                    const existingLeads = await base44.asServiceRole.entities.Lead.filter({
                        email: user_email
                    });

                    if (existingLeads.length > 0) {
                        // Update existing lead
                        await base44.asServiceRole.entities.Lead.update(existingLeads[0].id, {
                            last_activity_date: new Date().toISOString(),
                            notes: `${existingLeads[0].notes || ''}\n[${new Date().toLocaleDateString()}] Booked: ${service_type} - ${scheduled_date ? new Date(scheduled_date).toLocaleString() : 'Date TBD'}`
                        });
                    } else {
                        // Create new lead
                        const nameParts = (user_name || '').split(' ');
                        await base44.asServiceRole.entities.Lead.create({
                            first_name: nameParts[0] || '',
                            last_name: nameParts.slice(1).join(' ') || '',
                            email: user_email,
                            phone: intake_data?.phone || '',
                            stage: 'booked',
                            source: 'booking_system',
                            notes: `Initial booking: ${service_type} - ${scheduled_date ? new Date(scheduled_date).toLocaleString() : 'Date TBD'}`
                        });
                    }
                    // Update name on existing lead if missing
                    if (existingLeads.length > 0 && user_name) {
                        const nameParts = (user_name || '').split(' ');
                        const updates = {};
                        if (!existingLeads[0].first_name) updates.first_name = nameParts[0] || '';
                        if (!existingLeads[0].last_name) updates.last_name = nameParts.slice(1).join(' ') || '';
                        if (Object.keys(updates).length > 0) {
                            await base44.asServiceRole.entities.Lead.update(existingLeads[0].id, updates);
                        }
                    }
                    console.log('Lead created/updated in CRM for:', user_email);
                } catch (crmError) {
                    console.error('Failed to add to CRM (non-critical):', crmError.message);
                }

            return Response.json({
                success: true,
                booking_id: booking.id,
                redirect_url: `${req.headers.get('origin')}/BookingSuccess?booking_id=${booking.id}`
            });
        }

        // Paid sessions - require authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Please log in to book paid sessions' }, { status: 401 });
        }

        // Paid sessions - create Stripe checkout
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);

        const booking = await base44.asServiceRole.entities.Booking.create({
            user_email: user.email,
            user_name: user.full_name,
            staff_id,
            appointment_type_id,
            service_type,
            session_count,
            amount,
            currency: 'usd',
            payment_status: 'pending',
            booking_status: 'pending_payment',
            scheduled_date,
            checkout_expires_at: expiresAt.toISOString(),
            notes,
            client_phone: intake_data?.phone,
            client_contact_preference: intake_data?.contact_preference
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.email,
            client_reference_id: affiliate_code || null,
            metadata: {
                booking_id: booking.id,
                user_id: user.id,
                service_type,
                affiliate_code: affiliate_code || null
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Private Mind Styling - ${session_count} Session${session_count > 1 ? 's' : ''}`,
                            description: `1:1 coaching sessions with Roberta Fernandez`
                        },
                        unit_amount: amount
                    },
                    quantity: 1
                }
            ],
            success_url: `${req.headers.get('origin')}/BookingSuccess?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/bookings`
        });

        await base44.asServiceRole.entities.Booking.update(booking.id, {
            stripe_checkout_session_id: session.id
        });

        return Response.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});