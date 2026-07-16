import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      appointment_type_id, 
      start_date, 
      frequency, 
      occurrences,
      staff_id 
    } = await req.json();

    if (!appointment_type_id || !start_date || !frequency || !occurrences) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get appointment type
    const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({ 
      id: appointment_type_id 
    });
    const appointmentType = appointmentTypes[0];
    
    if (!appointmentType) {
      return Response.json({ error: 'Appointment type not found' }, { status: 404 });
    }

    // Generate series ID
    const seriesId = uuidv4();
    
    // Calculate dates based on frequency
    const bookingDates = [];
    let currentDate = new Date(start_date);
    
    for (let i = 0; i < occurrences; i++) {
      bookingDates.push(new Date(currentDate));
      
      // Add interval based on frequency
      if (frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Check slot availability for all dates
    const availabilityChecks = await Promise.all(
      bookingDates.map(async (date) => {
        const response = await base44.functions.invoke('checkSlotAvailability', {
          appointment_type_id,
          scheduled_date: date.toISOString(),
          staff_id
        });
        return response.data;
      })
    );

    const unavailableDates = availabilityChecks
      .map((check, idx) => ({ check, date: bookingDates[idx] }))
      .filter(({ check }) => !check.available);

    if (unavailableDates.length > 0) {
      return Response.json({ 
        error: 'Some time slots are not available',
        unavailable_dates: unavailableDates.map(ud => ud.date.toISOString())
      }, { status: 400 });
    }

    // Create Stripe checkout for total amount
    const totalAmount = appointmentType.price * occurrences;
    
    const stripeResponse = await base44.functions.invoke('createBookingCheckout', {
      appointment_type_id,
      scheduled_date: bookingDates[0].toISOString(),
      is_recurring: true,
      recurring_series_id: seriesId,
      recurrence_frequency: frequency,
      total_occurrences: occurrences,
      staff_id
    });

    return Response.json({
      checkout_url: stripeResponse.data.checkout_url,
      series_id: seriesId,
      booking_dates: bookingDates.map(d => d.toISOString()),
      total_amount: totalAmount
    });

  } catch (error) {
    console.error('Error creating recurring bookings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});